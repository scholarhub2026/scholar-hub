import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/app_user.dart';
import '../repositories/auth_repository.dart';

// AuthResult / SignupResult now live in the repository contract.
export '../repositories/auth_repository.dart' show AuthResult, SignupResult;

class AuthService implements AuthRepository {
  final ApiClient _api = ApiClient.instance;

  @override
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final res = await _api.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
      requiresAuth: false,
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to sign in.'));
    }
    final data = res.data as Map<String, dynamic>;
    return AuthResult(
      token: (data['token'] ?? '').toString(),
      refreshToken: data['refreshToken']?.toString(),
      user: AppUser.fromJson((data['user'] as Map).cast<String, dynamic>()),
    );
  }

  /// Registers a STUDENT account. Backend issues an OTP to verify the email.
  @override
  Future<SignupResult> signup({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
  }) async {
    final res = await _api.post(
      ApiConstants.signup,
      data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
      },
      requiresAuth: false,
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to create your account.'));
    }
    final data = (res.data as Map)['data'] as Map? ?? {};
    return SignupResult(
      userId: (data['userId'] ?? '').toString(),
      token: (data['token'] ?? '').toString(),
      role: (data['role'] ?? 'STUDENT').toString(),
    );
  }

  @override
  Future<void> verifyOtp({required String userId, required String otp}) async {
    final res = await _api.post(
      ApiConstants.verifyOtp(userId),
      data: {'otp': otp},
      requiresAuth: false,
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Invalid or expired OTP.'));
    }
  }

  @override
  Future<AppUser?> verifyToken() async {
    final res = await _api.get(ApiConstants.verifyToken);
    if (!ApiClient.isOk(res)) return null;
    final data = res.data;
    if (data is Map && data['user'] is Map) {
      return AppUser.fromJson((data['user'] as Map).cast<String, dynamic>());
    }
    return null;
  }

  @override
  Future<void> updatePassword({
    required String userId,
    required String password,
    required String confirmPassword,
  }) async {
    final res = await _api.put(
      ApiConstants.updateUser(userId),
      data: {'password': password, 'confirmPassword': confirmPassword},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update password.'));
    }
  }
}
