import 'package:equatable/equatable.dart';

import '../../data/models/app_user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Session state exposed by [AuthCubit]. Carries the resolved [AuthStatus] and
/// the signed-in [AppUser] (null when signed out), plus role helpers used by
/// the root gate to pick the right shell.
class AuthState extends Equatable {
  final AuthStatus status;
  final AppUser? user;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isAdmin => isAuthenticated && (user?.isAdmin ?? false);
  bool get isTutor => isAuthenticated && (user?.isTutor ?? false);
  bool get isStudent => !isAuthenticated || (user?.isStudent ?? true);

  AuthState copyWith({
    AuthStatus? status,
    AppUser? user,
    bool clearUser = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
    );
  }

  @override
  List<Object?> get props => [
        status,
        user?.id,
        user?.role,
        user?.firstName,
        user?.lastName,
        user?.email,
        user?.completedProfile,
        user?.isFirstLogin,
      ];
}
