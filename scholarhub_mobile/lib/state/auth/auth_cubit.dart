import 'dart:async';
import 'dart:convert';

import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/di/service_locator.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/local_storage_service.dart';
import '../../data/models/app_user.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/services/push_service.dart';
import 'auth_state.dart';

/// Holds the session: persists the JWT (secure storage) + user, restores it on
/// launch, and exposes login/signup/logout. Tokens are stored via
/// [LocalStorageService]; a failed refresh (broadcast on
/// [ApiClient.onSessionExpired]) tears the session down automatically.
class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _service;
  final LocalStorageService _storage;
  StreamSubscription<void>? _sessionExpiredSub;

  AuthCubit({AuthRepository? service, LocalStorageService? storage})
      : _service = service ?? sl<AuthRepository>(),
        _storage = storage ?? LocalStorageService.instance,
        super(const AuthState()) {
    // A failed token refresh means the session is dead — sign out.
    _sessionExpiredSub =
        ApiClient.instance.onSessionExpired.listen((_) => _forceLogout());
  }

  AppUser? get user => state.user;
  bool get isAuthenticated => state.isAuthenticated;

  Future<void> bootstrap() async {
    if (!_storage.hasSession) {
      emit(const AuthState(status: AuthStatus.unauthenticated));
      return;
    }

    // Optimistically restore the cached user for instant UI.
    final userJson = await _storage.getUserJson();
    if (userJson != null) {
      try {
        final cached =
            AppUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
        emit(AuthState(status: AuthStatus.authenticated, user: cached));
      } catch (_) {}
    }

    // Re-validate in the background (the client auto-refreshes on 401 first).
    try {
      final fresh = await _service.verifyToken();
      if (fresh != null) {
        emit(AuthState(status: AuthStatus.authenticated, user: fresh));
        await _storage.setUserJson(jsonEncode(fresh.toJson()));
      } else {
        // Definitive rejection (a refresh already failed if it could) — drop it.
        await _clear();
        emit(const AuthState(status: AuthStatus.unauthenticated));
      }
    } catch (_) {
      // Transient network hiccup: keep the cached session if we have one.
      if (state.user == null) {
        emit(const AuthState(status: AuthStatus.unauthenticated));
      }
    }

    if (state.status == AuthStatus.authenticated && state.user != null) {
      unawaited(PushService.instance.syncToken(state.user!.id));
    }
  }

  Future<AppUser> login({
    required String email,
    required String password,
  }) async {
    final result = await _service.login(email: email, password: password);
    await _persist(result);
    unawaited(PushService.instance.syncToken(result.user.id));
    return result.user;
  }

  Future<SignupResult> signup({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
  }) {
    return _service.signup(
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      password: password,
    );
  }

  Future<void> verifyOtp({required String userId, required String otp}) {
    return _service.verifyOtp(userId: userId, otp: otp);
  }

  Future<void> updatePassword({
    required String password,
    required String confirmPassword,
  }) {
    final id = state.user?.id;
    if (id == null || id.isEmpty) {
      throw const ApiException('You need to be signed in.');
    }
    return _service.updatePassword(
      userId: id,
      password: password,
      confirmPassword: confirmPassword,
    );
  }

  /// Replaces the cached user (e.g. after a mentor completes their profile).
  Future<void> refreshUser() async {
    try {
      final fresh = await _service.verifyToken();
      if (fresh != null) {
        await _storage.setUserJson(jsonEncode(fresh.toJson()));
        emit(AuthState(status: AuthStatus.authenticated, user: fresh));
      }
    } catch (_) {
      // Best-effort refresh; ignore failures.
    }
  }

  Future<void> logout() async {
    final userId = state.user?.id;
    await _clear();
    if (userId != null && userId.isNotEmpty) {
      unawaited(PushService.instance.clearToken(userId));
    }
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  /// Session invalidated out-of-band (refresh failed) — clear + emit signed-out.
  Future<void> _forceLogout() async {
    if (state.status == AuthStatus.unauthenticated) return;
    await logout();
  }

  Future<void> _persist(AuthResult result) async {
    await _storage.setTokens(
      access: result.token,
      refresh: result.refreshToken,
    );
    await _storage.setUserJson(jsonEncode(result.user.toJson()));
    emit(AuthState(status: AuthStatus.authenticated, user: result.user));
  }

  Future<void> _clear() => _storage.clearSession();

  @override
  Future<void> close() {
    _sessionExpiredSub?.cancel();
    return super.close();
  }
}
