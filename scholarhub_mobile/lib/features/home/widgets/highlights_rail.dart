import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/constants/app_content.dart';
import '../../../core/theme/app_colors.dart';
import 'home_section_header.dart';

/// Compact horizontal "why Scholar Hub" rail — app-native replacement for the
/// big marketing feature grid.
class HighlightsRail extends StatelessWidget {
  const HighlightsRail({super.key});

  static const _accents = [
    AppColors.primary,
    AppColors.indigo,
    AppColors.violet,
    AppColors.accent,
    AppColors.success,
    AppColors.primaryDark,
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w),
          child: const HomeSectionHeader(
            title: 'Why Scholar Hub',
            subtitle: 'Built to help you learn better',
          ),
        ),
        SizedBox(height: 16.h),
        SizedBox(
          height: 150.h,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            itemCount: AppContent.features.length,
            separatorBuilder: (_, _) => SizedBox(width: 14.w),
            itemBuilder: (context, i) {
              final f = AppContent.features[i];
              final accent = _accents[i % _accents.length];
              return Container(
                width: 200.w,
                padding: EdgeInsets.all(16.r),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(22.r),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 42.h,
                      width: 42.w,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(13.r),
                      ),
                      child: Icon(f.icon, color: accent, size: 21.sp),
                    ),
                    SizedBox(height: 12.h),
                    Text(
                      f.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14.sp,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    SizedBox(height: 5.h),
                    Flexible(
                      child: Text(
                        f.description,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11.5.sp,
                          height: 1.35,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
