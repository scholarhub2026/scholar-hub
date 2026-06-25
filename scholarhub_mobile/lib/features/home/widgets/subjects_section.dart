import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/constants/app_content.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/section_heading.dart';

class SubjectsSection extends StatelessWidget {
  final VoidCallback onBrowseMentors;

  const SubjectsSection({super.key, required this.onBrowseMentors});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: EdgeInsets.fromLTRB(20.w, 44.h, 20.w, 44.h),
      child: Column(
        children: [
          const SectionHeading(
            eyebrow: 'Explore',
            title: 'Popular Subjects',
            subtitle:
                'Our mentors specialize in a wide range of academic subjects '
                'to help you succeed in any area.',
          ),
          SizedBox(height: 24.h),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: AppContent.subjects.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.2,
            ),
            itemBuilder: (context, index) {
              final s = AppContent.subjects[index];
              return _SubjectChip(subject: s, onTap: onBrowseMentors);
            },
          ),
        ],
      ),
    );
  }
}

class _SubjectChip extends StatelessWidget {
  final SubjectItem subject;
  final VoidCallback onTap;

  const _SubjectChip({required this.subject, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final bg = subject.colors[0];
    final fg = subject.colors[1];
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(18.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(18.r),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
          child: Row(
            children: [
              Container(
                height: 38.h,
                width: 38.w,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Icon(subject.icon, color: fg, size: 20.sp),
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(
                  subject.name,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13.sp,
                    color: fg,
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
