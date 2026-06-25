import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking_draft.dart';
import '../../../widgets/primary_button.dart';

class BookingConfirmation extends StatelessWidget {
  final BookingDraft draft;
  final VoidCallback onDone;

  const BookingConfirmation({
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
                decoration: BoxDecoration(
                  color: AppColors.successSoft,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.partyPopper,
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
              'Booking Confirmed!',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ).animate().fadeIn(delay: 150.ms).moveY(begin: 12, end: 0),
            SizedBox(height: 10.h),
            const Text(
              'Your session request has been received. Complete the payment to '
              'lock in your slot.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, height: 1.5),
            ).animate().fadeIn(delay: 250.ms),
            SizedBox(height: 28.h),
            Container(
              padding: EdgeInsets.all(18.r),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20.r),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _row('Mentor', draft.mentor.fullName),
                  SizedBox(height: 12.h),
                  _row('Student', draft.studentName),
                  SizedBox(height: 12.h),
                  _row('Amount', Formatters.rupeesPlain(draft.totalAmount)),
                ],
              ),
            ).animate().fadeIn(delay: 350.ms),
            SizedBox(height: 16.h),
            Row(
              children: [
                Icon(LucideIcons.mail,
                    size: 15.sp, color: AppColors.textMuted),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    'A confirmation has been sent to ${draft.email}.',
                    style: TextStyle(
                      fontSize: 12.5.sp,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
              ],
            ),
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

  Widget _row(String label, String value) {
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
            fontSize: 13.5.sp,
          ),
        ),
      ],
    );
  }
}
