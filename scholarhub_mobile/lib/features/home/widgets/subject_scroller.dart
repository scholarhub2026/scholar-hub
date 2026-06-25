import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/constants/app_content.dart';
import 'home_section_header.dart';

/// Horizontal, colourful "browse by subject" rail.
class SubjectScroller extends StatelessWidget {
  final void Function(String subject) onSubjectTap;
  final VoidCallback onSeeAll;

  const SubjectScroller({
    super.key,
    required this.onSubjectTap,
    required this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w),
          child: HomeSectionHeader(
            title: 'Browse by subject',
            actionLabel: 'See all',
            onAction: onSeeAll,
          ),
        ),
        SizedBox(height: 14.h),
        SizedBox(
          height: 104.h,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            itemCount: AppContent.subjects.length,
            separatorBuilder: (_, _) => SizedBox(width: 12.w),
            itemBuilder: (context, i) {
              final s = AppContent.subjects[i];
              return GestureDetector(
                onTap: () => onSubjectTap(s.name),
                child: Container(
                  width: 92.w,
                  padding: EdgeInsets.all(12.r),
                  decoration: BoxDecoration(
                    color: s.colors[0],
                    borderRadius: BorderRadius.circular(20.r),
                    border: Border.all(
                        color: s.colors[1].withValues(alpha: 0.12)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        height: 42.h,
                        width: 42.w,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(14.r),
                        ),
                        child: Icon(s.icon, color: s.colors[1], size: 22.sp),
                      ),
                      SizedBox(height: 8.h),
                      Text(
                        s.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: s.colors[1],
                          fontWeight: FontWeight.w700,
                          fontSize: 11.sp,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
