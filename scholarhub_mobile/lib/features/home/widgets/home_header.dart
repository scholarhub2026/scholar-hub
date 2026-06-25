import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/navigation/app_navigator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../state/auth/auth_cubit.dart';
import '../../../widgets/app_logo.dart';
import '../../auth/account_sheet.dart';

/// App-style home header: gradient panel with a greeting, a tap-to-search bar
/// and two quick-action chips. Replaces the old web-style hero.
class HomeHeader extends StatelessWidget {
  final VoidCallback onBrowseMentors;

  const HomeHeader({super.key, required this.onBrowseMentors});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthCubit>().state;
    final firstName = auth.user?.firstName.trim();
    final greeting = (firstName != null && firstName.isNotEmpty)
        ? 'Hi $firstName 👋'
        : 'Welcome 👋';

    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 26.h),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(34.r)),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                AppLogo(height: 26.h, tile: true),
                SizedBox(width: 10.w),
                Expanded(
                  child: Text(
                    'Scholar Hub',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 18.sp,
                    ),
                  ),
                ),
                SizedBox(width: 10.w),
                if (!auth.isAuthenticated)
                  GestureDetector(
                    onTap: () => AppNavigator.toLogin(context),
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 9.h,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Text(
                        'Sign In',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13.5.sp,
                        ),
                      ),
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () => showAccountSheet(context),
                    child: Container(
                      height: 38.h,
                      width: 38.w,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Text(
                        (firstName != null && firstName.isNotEmpty)
                            ? firstName[0].toUpperCase()
                            : 'S',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 16.sp,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(height: 22.h),
            Text(
              greeting,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 15.sp,
                fontWeight: FontWeight.w600,
              ),
            ).animate().fadeIn(duration: 350.ms),
            SizedBox(height: 6.h),
            Text(
              'Find your perfect mentor ✨',
              style: TextStyle(
                color: Colors.white,
                fontSize: 27.sp,
                fontWeight: FontWeight.w800,
                height: 1.15,
              ),
            ).animate().fadeIn(delay: 80.ms).moveY(begin: 10, end: 0),
            SizedBox(height: 18.h),
            // Tap-to-search
            GestureDetector(
              onTap: onBrowseMentors,
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: 16.w,
                  vertical: 15.h,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.search,
                      color: AppColors.textMuted,
                      size: 20.sp,
                    ),
                    SizedBox(width: 12.w),
                    Text(
                      'Search mentors, subjects…',
                      style: TextStyle(
                        color: AppColors.textMuted.withValues(alpha: 0.9),
                        fontSize: 14.5.sp,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      height: 32.h,
                      width: 32.w,
                      decoration: BoxDecoration(
                        gradient: AppColors.brandGradient,
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      child: Icon(
                        LucideIcons.arrowRight,
                        color: Colors.white,
                        size: 18.sp,
                      ),
                    ),
                  ],
                ),
              ),
            ).animate().fadeIn(delay: 160.ms),
            SizedBox(height: 14.h),
            Row(
              children: [
                Expanded(
                  child: _quickChip(
                    icon: LucideIcons.send,
                    label: 'Enquiry Now',
                    onTap: () => AppNavigator.openEnquiry(context),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _quickChip(
                    icon: LucideIcons.userPlus,
                    label: 'Be a Mentor',
                    onTap: () => AppNavigator.openBecomeMentor(context),
                  ),
                ),
              ],
            ).animate().fadeIn(delay: 220.ms),
          ],
        ),
      ),
    );
  }

  Widget _quickChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12.h),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.16),
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 17.sp),
            SizedBox(width: 8.w),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13.sp,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
