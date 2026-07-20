import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../data/services/notification_router.dart';
import '../../state/auth/auth_cubit.dart';
import '../settings/settings_screen.dart';
import '../shell/widgets/app_bottom_nav.dart';
import 'availability/mentor_availability_screen.dart';
import 'dashboard/mentor_dashboard_screen.dart';
import 'earnings/mentor_earnings_screen.dart';
import 'mentor_bookings_cubit.dart';
import 'requests/mentor_requests_screen.dart';
import 'schedule/mentor_schedule_screen.dart';
import 'sessions/mentor_sessions_screen.dart';

const _mentorDestinations = <NavDestination>[
  NavDestination(
      LucideIcons.layoutDashboard, LucideIcons.layoutDashboard, 'Home'),
  NavDestination(LucideIcons.inbox, LucideIcons.inbox, 'Requests'),
  NavDestination(
      LucideIcons.calendarCheck, LucideIcons.calendarCheck, 'Schedule'),
  NavDestination(
      LucideIcons.clipboardList, LucideIcons.clipboardList, 'Sessions'),
  NavDestination(LucideIcons.wallet, LucideIcons.wallet, 'Earnings'),
  NavDestination(LucideIcons.settings, LucideIcons.settings, 'Settings'),
];

const _titles = [
  'Dashboard',
  'Requests',
  'My Schedule',
  'Sessions',
  'Earnings',
  'Settings',
];

/// Mentor experience: dashboard, schedule (with session logs), earnings and
/// settings. The mentor's bookings are loaded once and shared across the first
/// three tabs via [MentorBookingsCubit].
class MentorShell extends StatefulWidget {
  const MentorShell({super.key});

  @override
  State<MentorShell> createState() => _MentorShellState();
}

class _MentorShellState extends State<MentorShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    NotificationRouter.instance.pending.addListener(_onPending);
    WidgetsBinding.instance.addPostFrameCallback((_) => _onPending());
  }

  @override
  void dispose() {
    NotificationRouter.instance.pending.removeListener(_onPending);
    super.dispose();
  }

  /// Map a tapped notification to a mentor tab.
  void _onPending() {
    final pending = NotificationRouter.instance.pending.value;
    if (pending == null || !mounted) return;
    final target = switch (pending.type) {
      'booking' => 1, // Requests
      'mentor_approved' => 0, // Dashboard
      _ => 0,
    };
    if (target != _index) setState(() => _index = target);
    NotificationRouter.instance.consume();
  }

  void _go(int i) {
    if (i != _index) setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    final mentorId = context.read<AuthCubit>().state.user?.id ?? '';
    return BlocProvider(
      create: (_) => MentorBookingsCubit(mentorId)..load(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        extendBody: true,
        appBar: AppBar(
          title: Text(_titles[_index]),
          actions: [
            // Manage the weekly availability template from the Schedule tab.
            if (_index == 2 && mentorId.isNotEmpty)
              IconButton(
                tooltip: 'Weekly availability',
                icon: const Icon(LucideIcons.calendarClock),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        MentorAvailabilityScreen(mentorId: mentorId),
                  ),
                ),
              ),
          ],
        ),
        body: IndexedStack(
          index: _index,
          children: const [
            MentorDashboardScreen(),
            MentorRequestsScreen(),
            MentorScheduleScreen(),
            MentorSessionsScreen(),
            MentorEarningsScreen(),
            SettingsScreen(),
          ],
        ),
        bottomNavigationBar: AppBottomNav(
          currentIndex: _index,
          onTap: _go,
          destinations: _mentorDestinations,
        ),
      ),
    );
  }
}
