import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/app_snackbar.dart';
import '../settings/settings_screen.dart';
import 'bookings/admin_bookings_screen.dart';
import 'classes/admin_classes_screen.dart';
import 'dashboard/admin_dashboard_screen.dart';
import 'inquiries/admin_inquiries_screen.dart';
import 'mentors/admin_mentors_screen.dart';
import 'subjects/admin_subjects_screen.dart';

class _AdminDest {
  final IconData icon;
  final String label;
  const _AdminDest(this.icon, this.label);
}

const _destinations = <_AdminDest>[
  _AdminDest(LucideIcons.layoutDashboard, 'Dashboard'),
  _AdminDest(LucideIcons.inbox, 'Enquiries'),
  _AdminDest(LucideIcons.users, 'Mentors'),
  _AdminDest(LucideIcons.graduationCap, 'Classes'),
  _AdminDest(LucideIcons.bookOpen, 'Subjects'),
  _AdminDest(LucideIcons.calendarCheck, 'Bookings'),
  _AdminDest(LucideIcons.settings, 'Settings'),
];

/// Admin experience: a navigation drawer (mirroring the web admin sidebar)
/// over an [IndexedStack] of the seven admin destinations.
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;

  void _go(int i) {
    Navigator.pop(context); // close the drawer
    if (i != _index) setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_destinations[_index].label),
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
      ),
      drawer: _AdminDrawer(currentIndex: _index, onSelect: _go),
      body: IndexedStack(
        index: _index,
        children: const [
          AdminDashboardScreen(),
          AdminInquiriesScreen(),
          AdminMentorsScreen(),
          AdminClassesScreen(),
          AdminSubjectsScreen(),
          AdminBookingsScreen(),
          SettingsScreen(),
        ],
      ),
    );
  }
}

class _AdminDrawer extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onSelect;

  const _AdminDrawer({required this.currentIndex, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    return Drawer(
      backgroundColor: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(20.r),
              decoration: const BoxDecoration(gradient: AppColors.brandGradient),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        height: 40.h,
                        width: 40.w,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: const Text(
                          'SH',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Text(
                        'Scholar Hub',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 17.sp,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    Formatters.initials(user?.firstName, user?.lastName) == 'SH'
                        ? 'Administrator'
                        : (user?.fullName ?? 'Administrator'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15.sp,
                    ),
                  ),
                  Text(
                    user?.email ?? 'Admin panel',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: 12.5.sp,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.symmetric(vertical: 8.h),
                itemCount: _destinations.length,
                itemBuilder: (_, i) {
                  final dest = _destinations[i];
                  final selected = i == currentIndex;
                  return ListTile(
                    leading: Icon(
                      dest.icon,
                      color:
                          selected ? AppColors.primary : AppColors.textMuted,
                    ),
                    title: Text(
                      dest.label,
                      style: TextStyle(
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w600,
                        color: selected
                            ? AppColors.primary
                            : AppColors.textPrimary,
                      ),
                    ),
                    selected: selected,
                    selectedTileColor: AppColors.primaryLight,
                    onTap: () => onSelect(i),
                  );
                },
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(LucideIcons.logOut, color: AppColors.danger),
              title: const Text(
                'Sign Out',
                style: TextStyle(
                  color: AppColors.danger,
                  fontWeight: FontWeight.w700,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                context.read<AuthCubit>().logout();
                AppSnackbar.info(context, 'You have been signed out.');
              },
            ),
          ],
        ),
      ),
    );
  }
}
