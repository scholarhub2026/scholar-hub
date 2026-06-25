/// Authenticated user returned by `/auth/login` and `/auth/verify-token`.
class AppUser {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String role; // ADMIN | TUTOR | STUDENT
  final bool completedProfile;
  final bool isFirstLogin;

  const AppUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    this.completedProfile = false,
    this.isFirstLogin = false,
  });

  String get fullName => '$firstName $lastName'.trim();

  bool get isStudent => role.toUpperCase() == 'STUDENT';
  bool get isTutor => role.toUpperCase() == 'TUTOR';
  bool get isAdmin => role.toUpperCase() == 'ADMIN';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: (json['id'] ?? json['_id'] ?? json['userId'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'STUDENT').toString(),
      completedProfile: json['completed_profile'] == true,
      isFirstLogin: json['is_first_login'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'role': role,
        'completed_profile': completedProfile,
        'is_first_login': isFirstLogin,
      };
}
