import 'dart:convert';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/network/api_client.dart';
import '../../data/models/app_user.dart';
import '../../data/services/auth_service.dart';
import 'auth_state.dart';

/// Holds the session: persists the JWT + user, restores it on launch, and
/// exposes login/signup/logout to the UI. The replacement for the old
/// `provider`-based `AuthProvider` — now a `flutter_bloc` Cubit.
class AuthCubit extends Cubit<AuthState> {
  static const _userKey = 'sh_user';

  final AuthService _service;

  AuthCubit({AuthService? service})
      : _service = service ?? AuthService(),
        super(const AuthState());

  AppUser? get user => state.user;
  bool get isAuthenticated => state.isAuthenticated;

  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(ApiClient.tokenKey);
    final userJson = prefs.getString(_userKey);

    if (token == null || token.isEmpty) {
      emit(const AuthState(status: AuthStatus.unauthenticated));
      return;
    }

    // Optimistically restore the cached user for instant UI.
    if (userJson != null) {
      try {
        final cached =
            AppUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
        emit(AuthState(status: AuthStatus.authenticated, user: cached));
      } catch (_) {}
    }

    // Re-validate in the background.
    try {
      final fresh = await _service.verifyToken();
      if (fresh != null) {
        emit(AuthState(status: AuthStatus.authenticated, user: fresh));
        await prefs.setString(_userKey, jsonEncode(fresh.toJson()));
      } else {
        // A null result is a definitive server rejection (401/403 resolves to a
        // non-OK response, not a thrown error), so the token is dead — drop the
        // session even if we optimistically restored a cached user above.
        await _clear();
        emit(const AuthState(status: AuthStatus.unauthenticated));
      }
    } catch (_) {
      // Thrown error == transient network hiccup: keep the cached session if we
      // have one, otherwise fall back to signed-out.
      if (state.user == null) {
        emit(const AuthState(status: AuthStatus.unauthenticated));
      }
    }
  }

  Future<AppUser> login({
    required String email,
    required String password,
  }) async {
    final result = await _service.login(email: email, password: password);
    await _persist(result.token, result.user);
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
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(fresh.toJson()));
        emit(AuthState(status: AuthStatus.authenticated, user: fresh));
      }
    } catch (_) {
      // Best-effort refresh; ignore failures.
    }
  }

  Future<void> logout() async {
    await _clear();
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  Future<void> _persist(String token, AppUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiClient.tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    emit(AuthState(status: AuthStatus.authenticated, user: user));
  }

  Future<void> _clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiClient.tokenKey);
    await prefs.remove(_userKey);
  }
}
