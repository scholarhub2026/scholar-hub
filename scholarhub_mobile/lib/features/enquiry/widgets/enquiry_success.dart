import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../widgets/primary_button.dart';
import '../enquiry_draft.dart';

/// Terminal success state shown after an enquiry is submitted.
class EnquirySuccess extends StatelessWidget {
  final EnquiryDraft draft;
  final VoidCallback onDone;

  const EnquirySuccess({
    super.key,
    required this.draft,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.all(24.r),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                height: 110.h,
                width: 110.w,
                decoration: const BoxDecoration(
                  color: AppColors.successSoft,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.mailCheck,
                  color: AppColors.success,
                  size: 54.sp,
                ),
              )
                  .animate()
                  .scale(
                    duration: 500.ms,
                    curve: Curves.easeOutBack,
                    begin: const Offset(0.5, 0.5),
                  )
                  .fadeIn(),
            ),
            SizedBox(height: 28.h),
            Text(
              'Enquiry sent!',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ).animate().fadeIn(delay: 150.ms).moveY(begin: 12, end: 0),
            SizedBox(height: 10.h),
            Text(
              'Thanks, ${draft.studentName.trim().isEmpty ? 'there' : draft.studentName.trim().split(' ').first}! '
              'Our team will contact you shortly to discuss classes with '
              '${draft.mentor.firstName} — no payment is needed now.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ).animate().fadeIn(delay: 250.ms),
            SizedBox(height: 20.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.phone, size: 15.sp, color: AppColors.textMuted),
                SizedBox(width: 8.w),
                Flexible(
                  child: Text(
                    'We\'ll reach you on ${draft.phone.trim()}.',
                    style: TextStyle(
                      fontSize: 12.5.sp,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
              ],
            ).animate().fadeIn(delay: 350.ms),
            const Spacer(),
            PrimaryButton(
              label: 'Back to Home',
              icon: LucideIcons.home,
              onPressed: onDone,
            ),
          ],
        ),
      ),
    );
  }
}
