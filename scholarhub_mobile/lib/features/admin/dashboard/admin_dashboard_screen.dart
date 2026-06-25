import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/inquiry.dart';
import '../../../data/services/inquiry_service.dart';
import '../../../state/auth/auth_cubit.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import '../inquiries/inquiry_status_sheet.dart';
import 'admin_dashboard_cubit.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final adminId = context.read<AuthCubit>().state.user?.id ?? '';
    return BlocProvider(
      create: (_) => AdminDashboardCubit()..load(adminId),
      child: _DashboardView(adminId: adminId),
    );
  }
}

class _DashboardView extends StatelessWidget {
  final String adminId;
  const _DashboardView({required this.adminId});

  Future<void> _editInquiry(BuildContext context, Inquiry inquiry) async {
    final cubit = context.read<AdminDashboardCubit>();
    final status =
        await showInquiryStatusSheet(context, current: inquiry.status);
    if (status == null || status == inquiry.status) return;
    try {
      await InquiryService().updateStatus(inquiry.id, status);
      await cubit.load(adminId);
      if (context.mounted) AppSnackbar.success(context, 'Enquiry updated.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    return BlocBuilder<AdminDashboardCubit, AdminDashboardState>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }
        if (state.status == ViewStatus.failure) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load the dashboard.',
            onRetry: () => context.read<AdminDashboardCubit>().load(adminId),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => context.read<AdminDashboardCubit>().load(adminId),
          child: ListView(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 32.h),
            children: [
              Text(
                'Welcome back${user?.firstName.isNotEmpty == true ? ', ${user!.firstName}' : ''} 👋',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 20.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                'Here is what is happening across Scholar Hub.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
              ),
              SizedBox(height: 18.h),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _StatCard(
                    icon: LucideIcons.inbox,
                    label: 'Pending enquiries',
                    value: '${state.pendingInquiries}',
                    color: AppColors.warning,
                  ),
                  _StatCard(
                    icon: LucideIcons.calendarCheck,
                    label: 'Total bookings',
                    value: '${state.totalBookings}',
                    color: AppColors.primary,
                  ),
                  _StatCard(
                    icon: LucideIcons.userCheck,
                    label: 'Approved mentors',
                    value: '${state.approvedMentors}',
                    color: AppColors.success,
                  ),
                  _StatCard(
                    icon: LucideIcons.userPlus,
                    label: 'Pending mentors',
                    value: '${state.pendingMentors}',
                    color: AppColors.violet,
                  ),
                ],
              ),
              SizedBox(height: 24.h),
              Row(
                children: [
                  Text(
                    'Pending enquiries',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16.sp,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(width: 8.w),
                  if (state.pendingInquiries > 0)
                    Container(
                      padding: EdgeInsets.symmetric(
                          horizontal: 8.w, vertical: 2.h),
                      decoration: const BoxDecoration(
                        color: AppColors.danger,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${state.pendingInquiries}',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              SizedBox(height: 12.h),
              if (state.recentPending.isEmpty)
                Container(
                  padding: EdgeInsets.all(20.r),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18.r),
                  ),
                  child: const Center(
                    child: Text(
                      'No pending enquiries 🎉',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                )
              else
                ...state.recentPending.map(
                  (i) => Padding(
                    padding: EdgeInsets.only(bottom: 10.h),
                    child: _PendingTile(
                      inquiry: i,
                      onTap: () => _editInquiry(context, i),
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

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            height: 38.h,
            width: 38.w,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(11.r),
            ),
            child: Icon(icon, color: color, size: 20.sp),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 24.sp,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12.5.sp,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingTile extends StatelessWidget {
  final Inquiry inquiry;
  final VoidCallback onTap;
  const _PendingTile({required this.inquiry, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(16.r),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(14.r),
          child: Row(
            children: [
              Container(
                height: 40.h,
                width: 40.w,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Text(
                  inquiry.name.isNotEmpty ? inquiry.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: AppColors.warning,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      inquiry.name.isEmpty ? 'Unknown' : inquiry.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '${inquiry.subject.isEmpty ? 'General' : inquiry.subject} · ${Formatters.date(inquiry.createdAt)}',
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
              Icon(LucideIcons.userCog,
                  color: AppColors.primary, size: 20.sp),
            ],
          ),
        ),
      ),
    );
  }
}
