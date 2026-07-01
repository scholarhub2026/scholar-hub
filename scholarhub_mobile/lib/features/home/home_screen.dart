import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import 'widgets/ads_carousel.dart';
import 'widgets/cta_section.dart';
import 'widgets/highlights_rail.dart';
import 'widgets/home_header.dart';
import 'widgets/subject_scroller.dart';
import 'widgets/testimonials_section.dart';
import 'widgets/top_mentors.dart';

class HomeScreen extends StatelessWidget {
  final VoidCallback onBrowseMentors;
  final void Function(String subject) onSubjectTap;

  const HomeScreen({
    super.key,
    required this.onBrowseMentors,
    required this.onSubjectTap,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          HomeHeader(onBrowseMentors: onBrowseMentors),
          SizedBox(height: 20.h),
          const AdsCarousel(),
          SizedBox(height: 26.h),
          SubjectScroller(
            onSubjectTap: onSubjectTap,
            onSeeAll: () => AppNavigator.toSubjects(context),
          ),
          SizedBox(height: 30.h),
          TopMentors(onBrowseMentors: onBrowseMentors),
          SizedBox(height: 30.h),
          const HighlightsRail(),
          SizedBox(height: 34.h),
          const TestimonialsSection(),
          CtaSection(onBrowseMentors: onBrowseMentors),
          SizedBox(height: 100.h),
        ],
      ),
    );
  }
}
