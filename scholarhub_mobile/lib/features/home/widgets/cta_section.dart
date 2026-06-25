import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/navigation/app_navigator.dart';
import '../../../core/theme/app_colors.dart';

class CtaSection extends StatelessWidget {
  final VoidCallback onBrowseMentors;

  const CtaSection({super.key, required this.onBrowseMentors});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20.w, 24.h, 20.w, 24.h),
      child: Container(
        padding: EdgeInsets.all(28.r),
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          borderRadius: BorderRadius.circular(30.r),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.35),
              blurRadius: 30,
              offset: const Offset(0, 16),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(LucideIcons.rocket, color: Colors.white, size: 34.sp),
            SizedBox(height: 16.h),
            Text(
              'Ready to Transform Your Academic Journey?',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24.sp,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            SizedBox(height: 12.h),
            Text(
              'Join thousands of students achieving their academic goals with '
              'personalized mentorship from experts in their field.',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 14.sp,
                height: 1.5,
              ),
            ),
            SizedBox(height: 22.h),
            Row(
              children: [
                Expanded(
                  child: _WhiteButton(
                    label: 'Find a Mentor',
                    icon: LucideIcons.search,
                    onTap: onBrowseMentors,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _WhiteButton(
                    label: 'Enquiry',
                    icon: LucideIcons.send,
                    filled: false,
                    onTap: () => AppNavigator.openEnquiry(context),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _WhiteButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  const _WhiteButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.filled = true,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? Colors.white : Colors.white.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(14.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(14.r),
        onTap: onTap,
        child: Container(
          height: 50.h,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14.r),
            border: filled
                ? null
                : Border.all(color: Colors.white.withValues(alpha: 0.5)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 18.sp,
                  color: filled ? AppColors.primary : Colors.white),
              SizedBox(width: 8.w),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: filled ? AppColors.primary : Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
