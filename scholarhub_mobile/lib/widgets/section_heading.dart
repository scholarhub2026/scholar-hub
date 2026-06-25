import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../core/theme/app_colors.dart';

/// Centered or left-aligned section header: small uppercase eyebrow, big
/// title, supporting subtitle.
class SectionHeading extends StatelessWidget {
  final String? eyebrow;
  final String title;
  final String? subtitle;
  final bool center;
  final Color eyebrowColor;

  const SectionHeading({
    super.key,
    this.eyebrow,
    required this.title,
    this.subtitle,
    this.center = true,
    this.eyebrowColor = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    final align = center ? CrossAxisAlignment.center : CrossAxisAlignment.start;
    final textAlign = center ? TextAlign.center : TextAlign.start;

    return Column(
      crossAxisAlignment: align,
      children: [
        if (eyebrow != null) ...[
          Text(
            eyebrow!.toUpperCase(),
            textAlign: textAlign,
            style: TextStyle(
              color: eyebrowColor,
              fontWeight: FontWeight.w700,
              fontSize: 12.sp,
              letterSpacing: 1.4,
            ),
          ),
          SizedBox(height: 10.h),
        ],
        Text(
          title,
          textAlign: textAlign,
          style: Theme.of(context)
              .textTheme
              .headlineSmall
              ?.copyWith(fontWeight: FontWeight.w800, height: 1.15),
        ),
        if (subtitle != null) ...[
          SizedBox(height: 12.h),
          Text(
            subtitle!,
            textAlign: textAlign,
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppColors.textSecondary, height: 1.5),
          ),
        ],
      ],
    );
  }
}
