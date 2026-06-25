import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/navigation/app_navigator.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/mentor.dart';
import '../../../data/services/mentor_service.dart';
import '../../../widgets/network_avatar.dart';
import '../../../widgets/state_views.dart';
import 'home_section_header.dart';

/// Horizontal carousel of real mentors fetched from the API — the dynamic,
/// app-like centerpiece of the home feed.
class TopMentors extends StatefulWidget {
  final VoidCallback onBrowseMentors;

  const TopMentors({super.key, required this.onBrowseMentors});

  @override
  State<TopMentors> createState() => _TopMentorsState();
}

class _TopMentorsState extends State<TopMentors>
    with AutomaticKeepAliveClientMixin {
  final MentorService _service = MentorService();
  List<Mentor> _mentors = [];
  bool _loading = true;
  bool _failed = false;

  // Keep the loaded carousel alive so scrolling it out of (and back into) the
  // home ListView doesn't dispose the state and re-trigger a fetch + shimmer.
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final mentors = await _service.getApprovedMentors();
      if (!mounted) return;
      setState(() {
        _mentors = mentors.take(10).toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // required by AutomaticKeepAliveClientMixin
    // Hide the whole section if it failed or came back empty.
    if (!_loading && (_failed || _mentors.isEmpty)) {
      return const SizedBox.shrink();
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w),
          child: HomeSectionHeader(
            title: 'Meet our mentors',
            subtitle: 'Verified experts ready to help',
            actionLabel: 'See all',
            onAction: widget.onBrowseMentors,
          ),
        ),
        SizedBox(height: 16.h),
        SizedBox(
          height: 232.h,
          child: _loading
              ? ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  itemCount: 3,
                  separatorBuilder: (_, _) => SizedBox(width: 14.w),
                  itemBuilder: (_, _) =>
                      ShimmerBox(height: 232.h, width: 168.w, radius: 24),
                )
              : ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  itemCount: _mentors.length,
                  separatorBuilder: (_, _) => SizedBox(width: 14.w),
                  itemBuilder: (context, i) => _MentorMiniCard(
                    mentor: _mentors[i],
                    onTap: () => AppNavigator.toMentorDetail(
                        context, _mentors[i].id),
                  ),
                ),
        ),
      ],
    );
  }
}

class _MentorMiniCard extends StatelessWidget {
  final Mentor mentor;
  final VoidCallback onTap;

  const _MentorMiniCard({required this.mentor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final price = mentor.startingPrice;
    final subjects = mentor.subjectNames;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 168.w,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24.r),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1E293B).withValues(alpha: 0.06),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                CoverImage(
                  imageUrl: mentor.profilePic,
                  height: 116.h,
                  radius: 24,
                ),
                Positioned(
                  top: 10.h,
                  right: 10.w,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                        horizontal: 8.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.star,
                            size: 12.sp, color: AppColors.star),
                        SizedBox(width: 3.w),
                        Text(
                          mentor.ratingValue.toStringAsFixed(1),
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 11.sp,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 10.w,
                  bottom: (-16).h,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.surface, width: 3),
                    ),
                    child: NetworkAvatar(
                      imageUrl: mentor.profilePic,
                      initials: Formatters.initials(
                          mentor.firstName, mentor.lastName),
                      size: 40.r,
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(12.w, 22.h, 12.w, 14.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    mentor.fullName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14.5.sp,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    subjects.isNotEmpty
                        ? subjects.take(2).join(', ')
                        : mentor.headline,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11.5.sp,
                      color: AppColors.textMuted,
                    ),
                  ),
                  SizedBox(height: 10.h),
                  Row(
                    children: [
                      if (price != null)
                        Expanded(
                          child: Text(
                            'from ${Formatters.rupeesPlain(price)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13.sp,
                              color: AppColors.primary,
                            ),
                          ),
                        )
                      else
                        const Spacer(),
                      Container(
                        height: 28.h,
                        width: 28.w,
                        decoration: BoxDecoration(
                          gradient: AppColors.brandGradient,
                          borderRadius: BorderRadius.circular(9.r),
                        ),
                        child: Icon(LucideIcons.arrowRight,
                            color: Colors.white, size: 16.sp),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
