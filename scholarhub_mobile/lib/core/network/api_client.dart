import 'dart:async';

import 'package:dio/dio.dart';
import 'package:synchronized/synchronized.dart';

import '../constants/api_constants.dart';
import '../error/api_exception.dart';
import '../storage/local_storage_service.dart';

// Re-export so the many `import '.../api_client.dart'` call sites that reference
// ApiException keep compiling after it moved to core/error.
export '../error/api_exception.dart';

/// Dio wrapper: attaches the bearer token, and on a 401 transparently refreshes
/// the access token (single-flight) and replays the original request. A failed
/// refresh is broadcast on [onSessionExpired] so the session can be torn down.
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(_baseOptions());
    // A second Dio with NO interceptors performs the refresh call itself, so a
    // 401 during refresh can't recurse back into the refresh interceptor.
    _refreshDio = Dio(_baseOptions());

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final requiresAuth = options.extra[_requiresAuthKey] as bool? ?? true;
          if (requiresAuth) {
            final token = _storage.accessToken;
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (err, handler) => _onError(err, handler),
      ),
    );
  }

  static BaseOptions _baseOptions() => BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
        // Resolve 4xx (except 401) as responses so callers can read server
        // messages; 401 is thrown so the refresh interceptor can intercept it.
        validateStatus: (status) =>
            status != null && status < 500 && status != 401,
      );

  static const String tokenKey = 'sh_token'; // legacy (migration only)
  static const String _requiresAuthKey = 'requiresAuth';

  static final ApiClient instance = ApiClient._internal();

  final LocalStorageService _storage = LocalStorageService.instance;
  final Lock _refreshLock = Lock();

  late final Dio _dio;
  late final Dio _refreshDio;

  Dio get dio => _dio;

  /// Emits when a token refresh fails — the session is dead; listeners
  /// (AuthCubit) should log the user out.
  final StreamController<void> _sessionExpired =
      StreamController<void>.broadcast();
  Stream<void> get onSessionExpired => _sessionExpired.stream;

  // ---- 401 → refresh → replay ----
  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final requiresAuth =
        err.requestOptions.extra[_requiresAuthKey] as bool? ?? true;
    final isUnauthorized = response?.statusCode == 401;

    if (!isUnauthorized ||
        !requiresAuth ||
        (_storage.refreshToken ?? '').isEmpty) {
      // Not a refreshable 401 — pass the response through (so callers see the
      // non-OK status via isOk) or propagate a genuine transport error.
      if (response != null) return handler.resolve(response);
      return handler.next(err);
    }

    final failedBearer =
        err.requestOptions.headers['Authorization']?.toString();
    final refreshed = await _refreshAccessToken(failedBearer);
    if (!refreshed) {
      _sessionExpired.add(null);
      if (response != null) return handler.resolve(response);
      return handler.next(err);
    }

    // Replay the original request with the new bearer.
    try {
      err.requestOptions.headers['Authorization'] =
          'Bearer ${_storage.accessToken}';
      final replay = await _dio.fetch<dynamic>(err.requestOptions);
      return handler.resolve(replay);
    } on DioException catch (e) {
      if (e.response != null) return handler.resolve(e.response!);
      return handler.next(e);
    }
  }

  /// Single-flight refresh: concurrent 401s serialize on [_refreshLock]; only
  /// the first performs the network refresh, the rest replay with the new token.
  Future<bool> _refreshAccessToken(String? failedBearer) {
    return _refreshLock.synchronized(() async {
      // Another request already refreshed while we waited for the lock.
      final current = _storage.accessToken;
      if (current != null &&
          failedBearer != null &&
          failedBearer != 'Bearer $current') {
        return true;
      }
      final refresh = _storage.refreshToken;
      if (refresh == null || refresh.isEmpty) return false;
      try {
        final res = await _refreshDio.post<dynamic>(
          ApiConstants.refresh,
          data: {'refreshToken': refresh},
          options: Options(validateStatus: (s) => s != null && s < 500),
        );
        final data = res.data;
        if (res.statusCode == 200 && data is Map && data['token'] != null) {
          await _storage.setTokens(
            access: data['token'].toString(),
            refresh: (data['refreshToken'] ?? refresh).toString(),
          );
          return true;
        }
        return false;
      } catch (_) {
        return false;
      }
    });
  }

  // ---- Verbs (unchanged signatures) ----
  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
    bool requiresAuth = true,
  }) =>
      _send(() => _dio.get(path,
          queryParameters: query, options: _opts(requiresAuth)));

  Future<Response<dynamic>> post(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
    bool requiresAuth = true,
  }) =>
      _send(() => _dio.post(path,
          data: data, queryParameters: query, options: _opts(requiresAuth)));

  Future<Response<dynamic>> put(
    String path, {
    Object? data,
    bool requiresAuth = true,
  }) =>
      _send(() => _dio.put(path, data: data, options: _opts(requiresAuth)));

  Future<Response<dynamic>> patch(
    String path, {
    Object? data,
    bool requiresAuth = true,
  }) =>
      _send(() => _dio.patch(path, data: data, options: _opts(requiresAuth)));

  Future<Response<dynamic>> delete(
    String path, {
    Object? data,
    bool requiresAuth = true,
  }) =>
      _send(() => _dio.delete(path, data: data, options: _opts(requiresAuth)));

  Options _opts(bool requiresAuth) =>
      Options(extra: {_requiresAuthKey: requiresAuth});

  Future<Response<dynamic>> _send(
    Future<Response<dynamic>> Function() call,
  ) async {
    try {
      return await call();
    } on DioException catch (e) {
      throw _toException(e);
    }
  }

  ApiException _toException(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return const ApiException(
        'The connection timed out. Please check your network and try again.',
      );
    }
    if (e.type == DioExceptionType.connectionError) {
      return const ApiException(
        'Could not reach Scholar Hub. Please check your internet connection.',
      );
    }
    return ApiException(
      _messageFromResponse(e.response) ??
          'Something went wrong. Please try again.',
      e.response?.statusCode,
    );
  }

  static String? _messageFromResponse(Response<dynamic>? response) {
    final data = response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    return null;
  }

  /// Pulls a human-friendly message out of a non-2xx response body.
  static String messageFor(Response<dynamic> response,
      [String fallback = 'Something went wrong. Please try again.']) {
    return _messageFromResponse(response) ?? fallback;
  }

  static bool isOk(Response<dynamic> response) {
    final code = response.statusCode ?? 0;
    return code >= 200 && code < 300;
  }}
