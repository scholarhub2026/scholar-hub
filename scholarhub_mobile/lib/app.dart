import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'core/theme/app_theme.dart';
import 'data/services/notification_router.dart';
import 'flavors.dart';
import 'features/admin/admin_shell.dart';
import 'features/mentor/mentor_shell.dart';
import 'features/shell/app_shell.dart';
import 'features/shell/splash_screen.dart';
import 'state/auth/auth_cubit.dart';
import 'state/auth/auth_state.dart';

class ScholarHubApp extends StatelessWidget {
  const ScholarHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      // Reference device the layouts were designed against; all `.w/.h/.sp/.r`
      // sizes scale proportionally from here to the real device.
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) => MaterialApp(
        title: F.title,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        // Root navigator so a notification tap can navigate from anywhere,
        // including a cold start (see NotificationRouter / PushService).
        navigatorKey: NotificationRouter.instance.navigatorKey,
        home: child,
      ),
      child: const _RootGate(),
    );
  }
}

/// Shows the splash until the auth session has been resolved, then reveals the
/// shell for the signed-in role:
///   ADMIN → [AdminShell], TUTOR → [MentorShell], else → [AppShell] (student /
///   guest — auth is optional for browsing, the shell handles gating).
class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 450),
          child: _shellFor(state),
        );
      },
    );
  }

  Widget _shellFor(AuthState state) {
    if (state.status == AuthStatus.unknown) {
      return const SplashScreen(key: ValueKey('splash'));
    }
    if (state.isAdmin) {
      return const AdminShell(key: ValueKey('admin'));
    }
    if (state.isTutor) {
      return const MentorShell(key: ValueKey('mentor'));
    }
    return const AppShell(key: ValueKey('student'));
  }
}
