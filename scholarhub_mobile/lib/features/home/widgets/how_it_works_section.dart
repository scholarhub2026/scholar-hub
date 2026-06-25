import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/constants/app_content.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/section_heading.dart';

class HowItWorksSection extends StatelessWidget {
  const HowItWorksSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.heroGlow),
      padding: EdgeInsets.fromLTRB(20.w, 44.h, 20.w, 44.h),
      child: Column(
        children: [
          const SectionHeading(
            eyebrow: 'Simple Steps',
            title: 'How Scholar Hub Works',
            subtitle:
                'Getting started is easy. We connect you with the right mentor '
                'in just a few simple steps.',
          ),
          SizedBox(height: 28.h),
          ...List.generate(AppContent.howItWorks.length, (i) {
            final step = AppContent.howItWorks[i];
            final isLast = i == AppContent.howItWorks.length - 1;
            return _StepRow(step: step, isLast: isLast);
          }),
        ],
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final StepItem step;
  final bool isLast;

  const _StepRow({required this.step, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                height: 48.h,
                width: 48.w,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(16.r),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 14,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Text(
                  step.number,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16.sp,
                  ),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2.w,
                    margin: EdgeInsets.symmetric(vertical: 4.h),
                    color: AppColors.primary.withValues(alpha: 0.18),
                  ),
                ),
            ],
          ),
          SizedBox(width: 16.w),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 22.h, top: 4.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16.sp,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 6.h),
                  Text(
                    step.description,
                    style: TextStyle(
                      fontSize: 13.5.sp,
                      height: 1.45,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
