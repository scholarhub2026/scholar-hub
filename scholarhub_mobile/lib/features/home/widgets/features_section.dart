import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/constants/app_content.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/section_heading.dart';

class FeaturesSection extends StatelessWidget {
  const FeaturesSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: EdgeInsets.fromLTRB(20.w, 44.h, 20.w, 44.h),
      child: Column(
        children: [
          const SectionHeading(
            eyebrow: 'Why Scholar Hub',
            title: 'A Better Way to Learn and Grow',
            subtitle:
                'A comprehensive platform designed to help students excel '
                'academically and develop personally.',
          ),
          SizedBox(height: 28.h),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: AppContent.features.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              // Slightly taller cards so the description has room (iOS fonts
              // render taller than Android).
              childAspectRatio: 0.66,
            ),
            itemBuilder: (context, index) {
              final f = AppContent.features[index];
              return _FeatureCard(feature: f);
            },
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final FeatureItem feature;
  const _FeatureCard({required this.feature});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(22.r),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 50.h,
            width: 50.w,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.circular(15.r),
            ),
            child: Icon(feature.icon, color: Colors.white, size: 24.sp),
          ),
          // Fixed gap (not a Spacer) so the description keeps all remaining
          // vertical space instead of splitting it with the flexible spacer.
          SizedBox(height: 16.h),
          Text(
            feature.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15.sp,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Flexible(
            child: Text(
              feature.description,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12.5.sp,
                height: 1.35,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
