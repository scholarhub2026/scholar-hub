import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/constants/app_content.dart';
import '../../../core/theme/app_colors.dart';
import '../../../widgets/section_heading.dart';

class TestimonialsSection extends StatefulWidget {
  const TestimonialsSection({super.key});

  @override
  State<TestimonialsSection> createState() => _TestimonialsSectionState();
}

class _TestimonialsSectionState extends State<TestimonialsSection> {
  final _controller = PageController(viewportFraction: 0.88);
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.heroGlow),
      padding: EdgeInsets.fromLTRB(0, 44.h, 0, 44.h),
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            child: const SectionHeading(
              eyebrow: 'Loved by Learners',
              title: 'What Our Community Says',
              subtitle:
                  'Hear from students, parents, and mentors who are part of '
                  'the Scholar Hub community.',
            ),
          ),
          SizedBox(height: 24.h),
          SizedBox(
            height: 240.h,
            child: PageView.builder(
              controller: _controller,
              itemCount: AppContent.testimonials.length,
              onPageChanged: (i) => setState(() => _page = i),
              itemBuilder: (context, index) {
                return Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8.w),
                  child: _TestimonialCard(item: AppContent.testimonials[index]),
                );
              },
            ),
          ),
          SizedBox(height: 18.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              AppContent.testimonials.length,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: EdgeInsets.symmetric(horizontal: 3.w),
                height: 8.h,
                width: _page == i ? 22.w : 8.w,
                decoration: BoxDecoration(
                  color: _page == i
                      ? AppColors.primary
                      : AppColors.primary.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(4.r),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TestimonialCard extends StatelessWidget {
  final TestimonialItem item;
  const _TestimonialCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(22.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withValues(alpha: 0.06),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.quote,
              color: AppColors.primary.withValues(alpha: 0.4), size: 30.sp),
          SizedBox(height: 10.h),
          Expanded(
            child: Text(
              item.content,
              maxLines: 5,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14.sp,
                height: 1.5,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              ClipOval(
                child: CachedNetworkImage(
                  imageUrl: item.image,
                  height: 44.h,
                  width: 44.w,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => Container(
                    height: 44.h,
                    width: 44.w,
                    color: AppColors.surfaceAlt,
                    child: Icon(LucideIcons.user,
                        color: AppColors.primary, size: 20.sp),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.author,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      item.role,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
