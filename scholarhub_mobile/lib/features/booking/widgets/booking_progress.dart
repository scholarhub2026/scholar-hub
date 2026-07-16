import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';

class BookingProgress extends StatelessWidget {
  final int currentStep;
  static const _labels = ['Plan', 'Schedule', 'Details', 'Review', 'Done'];

  const BookingProgress({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      child: Row(
        children: List.generate(_labels.length * 2 - 1, (i) {
          if (i.isOdd) {
            final stepBefore = i ~/ 2;
            final done = currentStep > stepBefore;
            return Expanded(
              child: Container(
                height: 3.h,
                margin: EdgeInsets.symmetric(horizontal: 4.w),
                decoration: BoxDecoration(
                  color: done ? AppColors.primary : AppColors.border,
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
            );
          }
          final step = i ~/ 2;
          final isDone = currentStep > step;
          final isActive = currentStep == step;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                height: 34.h,
                width: 34.w,
                decoration: BoxDecoration(
                  gradient: (isDone || isActive)
                      ? AppColors.brandGradient
                      : null,
                  color: (isDone || isActive) ? null : AppColors.surfaceMuted,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isActive
                        ? AppColors.primary
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Icon(
                  isDone ? LucideIcons.check : _iconFor(step),
                  size: 16.sp,
                  color: (isDone || isActive)
                      ? Colors.white
                      : AppColors.textMuted,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                _labels[step],
                style: TextStyle(
                  fontSize: 10.5.sp,
                  fontWeight: FontWeight.w600,
                  color: isActive ? AppColors.primary : AppColors.textMuted,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  IconData _iconFor(int step) {
    switch (step) {
      case 0:
        return LucideIcons.bookOpen;
      case 1:
        return LucideIcons.calendarClock;
      case 2:
        return LucideIcons.user;
      case 3:
        return LucideIcons.clipboardCheck;
      default:
        return LucideIcons.check;
    }
  }
}
