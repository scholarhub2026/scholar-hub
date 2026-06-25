import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/constants/app_content.dart';
import '../../../core/navigation/app_navigator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/primary_button.dart';

class HeroSection extends StatelessWidget {
  final VoidCallback onBrowseMentors;

  const HeroSection({super.key, required this.onBrowseMentors});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.heroGlow),
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 28.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badge
          Container(
            padding:
                EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(30.r),
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.sparkles,
                    size: 15.sp, color: AppColors.primaryDark),
                SizedBox(width: 8.w),
                Text(
                  AppContent.heroBadge,
                  style: TextStyle(
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.w600,
                    fontSize: 12.5.sp,
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).moveY(begin: 10, end: 0),
          SizedBox(height: 20.h),
          // Headline
          RichText(
            text: TextSpan(
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontSize: 36.sp,
                    height: 1.1,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
              children: const [
                TextSpan(text: 'Expert '),
                TextSpan(
                  text: 'Mentorship',
                  style: TextStyle(color: AppColors.primary),
                ),
                TextSpan(text: ' for Academic Excellence'),
              ],
            ),
          ).animate().fadeIn(delay: 100.ms, duration: 450.ms).moveY(begin: 14, end: 0),
          SizedBox(height: 16.h),
          Text(
            AppContent.heroSubtitle,
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(height: 1.5, fontSize: 15.5.sp),
          ).animate().fadeIn(delay: 200.ms),
          SizedBox(height: 24.h),
          // CTAs
          PrimaryButton(
            label: 'Enquiry Now',
            icon: LucideIcons.send,
            onPressed: () => AppNavigator.openEnquiry(context),
          ).animate().fadeIn(delay: 250.ms).moveY(begin: 12, end: 0),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Browse',
                  icon: LucideIcons.search,
                  onPressed: onBrowseMentors,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: SecondaryButton(
                  label: 'Be a Mentor',
                  icon: LucideIcons.userPlus,
                  onPressed: () => AppNavigator.openBecomeMentor(context),
                ),
              ),
            ],
          ).animate().fadeIn(delay: 300.ms),
          SizedBox(height: 28.h),
          _HeroImageCard()
              .animate()
              .fadeIn(delay: 350.ms, duration: 500.ms)
              .scale(begin: const Offset(0.96, 0.96)),
        ],
      ),
    );
  }
}

class _HeroImageCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(28.r),
          child: Stack(
            children: [
              Image.asset(
                'assets/images/home.jpeg',
                height: 320.h,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                      colors: [
                        AppColors.primaryDark.withValues(alpha: 0.35),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        // Floating glass card — affordable sessions
        Positioned(
          right: 14,
          top: 16,
          child: _GlassCard(
            icon: LucideIcons.wallet,
            title: 'Affordable Sessions',
            subtitle: AppContent.heroPriceNote,
          ),
        ),
        // Floating glass card — overseas
        Positioned(
          left: 14,
          bottom: -14,
          child: _GlassCard(
            icon: LucideIcons.globe2,
            title: 'Online classes',
            subtitle: 'For overseas students',
          ),
        ),
      ],
    );
  }
}

class _GlassCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _GlassCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 200),
      padding: EdgeInsets.all(12.r),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(16.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 38.h,
            width: 38.w,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Icon(icon, size: 20.sp, color: AppColors.primary),
          ),
          SizedBox(width: 10.w),
          Flexible(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11.sp,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
