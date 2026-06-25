import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../state/auth/auth_cubit.dart';
import '../../state/auth/auth_state.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/network_avatar.dart';
import '../profile/update_password_screen.dart';

/// Shared settings panel for the admin & mentor shells: account summary,
/// change-password and sign-out. Plain (Scaffold-less) so it can live inside a
/// shell's body.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 32.h),
      children: [
        Container(
          padding: EdgeInsets.all(18.r),
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            borderRadius: BorderRadius.circular(22.r),
          ),
          child: Row(
            children: [
              NetworkAvatar(
                imageUrl: null,
                initials: Formatters.initials(user?.firstName, user?.lastName),
                size: 52.r,
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (user?.fullName.trim().isNotEmpty ?? false)
                          ? user!.fullName
                          : 'Scholar Hub',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 17.sp,
                      ),
                    ),
                    Text(
                      user?.email ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 13.sp,
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Container(
                      padding: EdgeInsets.symmetric(
                          horizontal: 10.w, vertical: 3.h),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Text(
                        user?.role ?? 'USER',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 11.sp,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 22.h),
        _tile(
          icon: LucideIcons.keyRound,
          title: 'Update Password',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const UpdatePasswordScreen()),
          ),
        ),
        _tile(
          icon: LucideIcons.logOut,
          title: 'Sign Out',
          danger: true,
          onTap: () => _confirmLogout(context),
        ),
      ],
    );
  }

  Widget _tile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool danger = false,
  }) {
    final color = danger ? AppColors.danger : AppColors.primary;
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        child: InkWell(
          borderRadius: BorderRadius.circular(18.r),
          onTap: onTap,
          child: Padding(
            padding: EdgeInsets.all(14.r),
            child: Row(
              children: [
                Container(
                  height: 42.h,
                  width: 42.w,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(13.r),
                  ),
                  child: Icon(icon, color: color, size: 20.sp),
                ),
                SizedBox(width: 14.w),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14.5.sp,
                      color: danger ? AppColors.danger : AppColors.textPrimary,
                    ),
                  ),
                ),
                Icon(LucideIcons.chevronRight,
                    color: AppColors.textMuted, size: 18.sp),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(22.r)),
        title: const Text('Sign out?'),
        content: const Text('You can always sign back in anytime.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<AuthCubit>().logout();
              AppSnackbar.info(context, 'You have been signed out.');
            },
            child: const Text('Sign Out',
                style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

/// Builds the localized [AuthState] role label for headers.
String roleLabel(AuthState state) {
  if (state.isAdmin) return 'Administrator';
  if (state.isTutor) return 'Mentor';
  return 'Student';
}
