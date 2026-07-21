import '../models/app_user.dart';

class AuthResult {
  final String token;
  final String? refreshToken;
  final AppUser user;
  const AuthResult({required this.token, this.refreshToken, required this.user});
}

class SignupResult {
  final String userId;
  final String token;
  final String role;
  const SignupResult({
    required this.userId,
    required this.token,
    required this.role,
  });
}

/// Auth data contract — implemented by `AuthService`, resolved via get_it. The
/// cubit depends on this abstraction, not the concrete HTTP service.
abstract class AuthRepository {
  Future<AuthResult> login({required String email, required String password});

  Future<SignupResult> signup({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
  });

  Future<void> verifyOtp({required String userId, required String otp});

  /// Validates the stored access token and returns the latest user, or null if
  /// the token is rejected.
  Future<AppUser?> verifyToken();

  Future<void> updatePassword({
    required String userId,
    required String password,
    required String confirmPassword,
  });
}
