import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/mentor.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/network_avatar.dart';
import '../../../widgets/state_views.dart';
import 'admin_mentors_cubit.dart';

class AdminMentorsScreen extends StatelessWidget {
  const AdminMentorsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminMentorsCubit()..load(),
      child: const _MentorsView(),
    );
  }
}

class _MentorsView extends StatelessWidget {
  const _MentorsView();

  Future<void> _approve(BuildContext context, Mentor mentor) async {
    final cubit = context.read<AdminMentorsCubit>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22.r)),
        title: const Text('Approve mentor?'),
        content: Text(
          'Approve ${mentor.fullName.isEmpty ? mentor.email : mentor.fullName}? '
          'They will receive login credentials by email.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Approve'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await cubit.approve(mentor.id);
      if (context.mounted) AppSnackbar.success(context, 'Mentor approved.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to approve.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminMentorsCubit, AdminMentorsState>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading) {
          return const ShimmerList(itemHeight: 96);
        }
        if (state.status == ViewStatus.failure) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load mentors.',
            onRetry: () => context.read<AdminMentorsCubit>().load(),
          );
        }
        if (state.pending.isEmpty && state.approved.isEmpty) {
          return const EmptyState(
            icon: LucideIcons.users,
            title: 'No mentors yet',
            message: 'Mentor applications and approved mentors appear here.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => context.read<AdminMentorsCubit>().load(),
          child: ListView(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 32.h),
            children: [
              if (state.pending.isNotEmpty) ...[
                _SectionHeader(
                  title: 'Pending approval',
                  count: state.pending.length,
                  color: AppColors.warning,
                ),
                SizedBox(height: 10.h),
                ...state.pending.map(
                  (m) => Padding(
                    padding: EdgeInsets.only(bottom: 10.h),
                    child: _MentorCard(
                      mentor: m,
                      approving: state.approvingId == m.id,
                      onApprove: () => _approve(context, m),
                      onView: () => showMentorProfileSheet(context, m),
                    ),
                  ),
                ),
                SizedBox(height: 14.h),
              ],
              _SectionHeader(
                title: 'Approved mentors',
                count: state.approved.length,
                color: AppColors.success,
              ),
              SizedBox(height: 10.h),
              if (state.approved.isEmpty)
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 16.h),
                  child: const Center(
                    child: Text(
                      'No approved mentors yet.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                )
              else
                ...state.approved.map(
                  (m) => Padding(
                    padding: EdgeInsets.only(bottom: 10.h),
                    child: _MentorCard(
                      mentor: m,
                      approving: false,
                      onView: () => showMentorProfileSheet(context, m),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  final Color color;
  const _SectionHeader({
    required this.title,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 16.sp,
            color: AppColors.textPrimary,
          ),
        ),
        SizedBox(width: 8.w),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 9.w, vertical: 2.h),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(20.r),
          ),
          child: Text(
            '$count',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 12.sp,
            ),
          ),
        ),
      ],
    );
  }
}

class _MentorCard extends StatelessWidget {
  final Mentor mentor;
  final bool approving;
  final VoidCallback? onApprove;
  final VoidCallback onView;

  const _MentorCard({
    required this.mentor,
    required this.approving,
    required this.onView,
    this.onApprove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          NetworkAvatar(
            imageUrl: mentor.profilePic,
            initials: Formatters.initials(mentor.firstName, mentor.lastName),
            size: 46.r,
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mentor.fullName.isEmpty ? mentor.email : mentor.fullName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14.5.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  mentor.phoneNumber.isEmpty ? mentor.email : mentor.phoneNumber,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5.sp,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 8.w),
          IconButton(
            tooltip: 'View profile',
            icon: Icon(LucideIcons.eye, size: 20.sp),
            color: AppColors.primary,
            onPressed: onView,
          ),
          if (onApprove != null)
            approving
                ? SizedBox(
                    height: 22.h,
                    width: 22.w,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2.4,
                      valueColor: AlwaysStoppedAnimation(AppColors.success),
                    ),
                  )
                : IconButton(
                    tooltip: 'Approve',
                    icon: Icon(LucideIcons.userCheck, size: 20.sp),
                    color: AppColors.success,
                    onPressed: onApprove,
                  ),
        ],
      ),
    );
  }
}

/// Read-only mentor detail sheet for admins.
Future<void> showMentorProfileSheet(BuildContext context, Mentor mentor) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      builder: (_, controller) => Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
        ),
        padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
        child: ListView(
          controller: controller,
          children: [
            Center(
              child: Container(
                height: 5.h,
                width: 44.w,
                margin: EdgeInsets.only(bottom: 18.h),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(3.r),
                ),
              ),
            ),
            Row(
              children: [
                NetworkAvatar(
                  imageUrl: mentor.profilePic,
                  initials:
                      Formatters.initials(mentor.firstName, mentor.lastName),
                  size: 56.r,
                ),
                SizedBox(width: 14.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mentor.fullName.isEmpty
                            ? 'Mentor'
                            : mentor.fullName,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Container(
                        margin: EdgeInsets.only(top: 4.h),
                        padding: EdgeInsets.symmetric(
                            horizontal: 10.w, vertical: 3.h),
                        decoration: BoxDecoration(
                          color: (mentor.adminApprove
                                  ? AppColors.success
                                  : AppColors.warning)
                              .withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(20.r),
                        ),
                        child: Text(
                          mentor.adminApprove ? 'Approved' : 'Pending',
                          style: TextStyle(
                            color: mentor.adminApprove
                                ? AppColors.success
                                : AppColors.warning,
                            fontWeight: FontWeight.w700,
                            fontSize: 11.5.sp,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 18.h),
            _detail(LucideIcons.mail, 'Email', mentor.email),
            _detail(LucideIcons.phone, 'Phone', mentor.phoneNumber),
            _detail(LucideIcons.mapPin, 'Location', mentor.location),
            _detail(LucideIcons.graduationCap, 'Qualification',
                mentor.educationQualification),
            _detail(LucideIcons.briefcase, 'Experience', mentor.experience),
            if (mentor.subjectNames.isNotEmpty)
              _detail(LucideIcons.bookOpen, 'Subjects',
                  mentor.subjectNames.join(', ')),
            if (mentor.message.isNotEmpty)
              _detail(LucideIcons.messageSquare, 'Message', mentor.message),
            _aboutSection(mentor),
          ],
        ),
      ),
    ),
  );
}

Widget _aboutSection(Mentor mentor) {
  final about = Formatters.stripHtml(mentor.additionalDetails);
  if (about.isEmpty) return const SizedBox.shrink();
  return Padding(
    padding: EdgeInsets.only(top: 8.h),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondary,
            fontSize: 12.5.sp,
          ),
        ),
        SizedBox(height: 6.h),
        Text(
          about,
          style: TextStyle(
            fontSize: 13.5.sp,
            height: 1.5,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    ),
  );
}

Widget _detail(IconData icon, String label, String value) {
  if (value.trim().isEmpty) return const SizedBox.shrink();
  return Padding(
    padding: EdgeInsets.only(bottom: 12.h),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16.sp, color: AppColors.textMuted),
        SizedBox(width: 10.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.5.sp,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14.sp,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
