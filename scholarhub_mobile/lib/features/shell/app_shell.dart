import 'package:flutter/material.dart';

import '../../data/services/notification_router.dart';
import '../bookings/bookings_screen.dart';
import '../home/home_screen.dart';
import '../mentors/mentors_screen.dart';
import '../profile/profile_screen.dart';
import 'widgets/app_bottom_nav.dart';

/// Root tabbed container. Holds the four primary destinations in an
/// [IndexedStack] so each tab keeps its scroll position and state.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  String? _mentorQuery;
  int _filterNonce = 0;

  @override
  void initState() {
    super.initState();
    NotificationRouter.instance.pending.addListener(_onPending);
    // Handle a tap that arrived before this shell mounted (cold start).
    WidgetsBinding.instance.addPostFrameCallback((_) => _onPending());
  }

  @override
  void dispose() {
    NotificationRouter.instance.pending.removeListener(_onPending);
    super.dispose();
  }

  /// Map a tapped notification to a student tab.
  void _onPending() {
    final pending = NotificationRouter.instance.pending.value;
    if (pending == null || !mounted) return;
    final target = switch (pending.type) {
      'booking' ||
      'booking_approved' ||
      'booking_rejected' ||
      'payment_due' ||
      'payment_recorded' =>
        2, // Bookings
      _ => 0, // Home
    };
    if (target != _index) setState(() => _index = target);
    NotificationRouter.instance.consume();
  }

  void _go(int i) {
    if (i == _index) return;
    setState(() => _index = i);
  }

  /// Open the Mentors tab pre-filtered by a subject tapped on the home feed.
  void _openMentorsForSubject(String subject) {
    setState(() {
      _index = 1;
      _mentorQuery = subject;
      _filterNonce++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _index,
        children: [
          HomeScreen(
            onBrowseMentors: () => _go(1),
            onSubjectTap: _openMentorsForSubject,
          ),
          MentorsScreen(
            initialQuery: _mentorQuery,
            filterNonce: _filterNonce,
          ),
          BookingsScreen(onBrowseMentors: () => _go(1)),
          ProfileScreen(onBrowseMentors: () => _go(1)),
        ],
      ),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _index,
        onTap: _go,
      ),
    );
  }
}
