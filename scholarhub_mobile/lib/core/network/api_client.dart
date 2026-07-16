import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/api_constants.dart';

/// Thin wrapper around a configured [Dio] instance. Attaches the bearer token
/// (when present) and normalises errors into [ApiException].
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
        // Treat all <500 as resolved so we can surface server messages.
        validateStatus: (status) => status != null && status < 500,
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static const String tokenKey = 'sh_token';

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;

  Dio get dio => _dio;

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    try {
      return await _dio.get(path, queryParameters: query);
    } on DioException catch (e) {
      throw _toException(e);
    }
  }

  Future<Response<dynamic>> post(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
  }) async {
    try {
      return await _dio.post(path, data: data, queryParameters: query);
    } on DioException catch (e) {
      throw _toException(e);
    }
  }

  Future<Response<dynamic>> put(
    String path, {
    Object? data,
  }) async {
    try {
      return await _dio.put(path, data: data);
    } on DioException catch (e) {
      throw _toException(e);
    }
  }

  Future<Response<dynamic>> patch(
    String path, {
    Object? data,
  }) async {
    try {
      return await _dio.patch(path, data: data);
    } on DioException catch (e) {
      throw _toException(e);
    }
  }

  Future<Response<dynamic>> delete(
    String path, {
    Object? data,
  }) async {
    try {
      return await _dio.delete(path, data: data);
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
    return ApiException(_messageFromResponse(e.response) ??
        'Something went wrong. Please try again.');
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
  }
}

class ApiException implements Exception {
  final String message;
  const ApiException(this.message);

  @override
  String toString() => message;
}
