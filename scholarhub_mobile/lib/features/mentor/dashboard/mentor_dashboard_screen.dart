import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../state/auth/auth_cubit.dart';
import '../../../state/view_status.dart';
import '../../../widgets/state_views.dart';
import '../mentor_bookings_cubit.dart';
import '../profile/mentor_profile_screen.dart';

class MentorDashboardScreen extends StatelessWidget {
  const MentorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthCubit>().state.user;
    final firstName = user?.firstName ?? '';
    return BlocBuilder<MentorBookingsCubit, MentorBookingsState>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading && state.bookings.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => context.read<MentorBookingsCubit>().load(),
          child: ListView(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 120.h),
            children: [
              Text(
                'Hi${firstName.isNotEmpty ? ', $firstName' : ''} 👋',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 22.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                'Here is your mentoring snapshot.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
              ),
              SizedBox(height: 16.h),
              if (user?.isFirstLogin == true) _ProfileBanner(),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _StatCard(
                    icon: LucideIcons.calendarClock,
                    label: 'Upcoming sessions',
                    value: '${state.upcomingSessions}',
                    color: AppColors.primary,
                  ),
                  _StatCard(
                    icon: LucideIcons.checkCircle2,
                    label: 'Completed',
                    value: '${state.completedSessions}',
                    color: AppColors.success,
                  ),
                  _StatCard(
                    icon: LucideIcons.wallet,
                    label: 'Earnings',
                    value: Formatters.rupeesPlain(state.totalEarnings),
                    color: AppColors.violet,
                  ),
                  _StatCard(
                    icon: LucideIcons.clock,
                    label: 'Pending payment',
                    value: Formatters.rupeesPlain(state.pendingEarnings),
                    color: AppColors.warning,
                  ),
                ],
              ),
              SizedBox(height: 24.h),
              Text(
                'Recent sessions',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 12.h),
              if (state.bookings.isEmpty)
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.h),
                  child: const EmptyState(
                    icon: LucideIcons.calendarCheck,
                    title: 'No sessions yet',
                    message: 'Your confirmed sessions will show up here.',
                  ),
                )
              else
                ...state.bookings.take(5).map(
                      (b) => Padding(
                        padding: EdgeInsets.only(bottom: 10.h),
                        child: Container(
                          padding: EdgeInsets.all(14.r),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16.r),
                          ),
                          child: Row(
                            children: [
                              Container(
                                height: 40.h,
                                width: 40.w,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  gradient: AppColors.brandGradient,
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: Icon(LucideIcons.user,
                                    color: Colors.white, size: 20.sp),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      b.studentName.isEmpty
                                          ? 'Student'
                                          : b.studentName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      Formatters.date(b.createdAt),
                                      style: TextStyle(
                                        fontSize: 12.sp,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                Formatters.rupeesPlain(b.totalAmount),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
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

class _ProfileBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        gradient: AppColors.sunsetGradient,
        borderRadius: BorderRadius.circular(18.r),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: Colors.white),
          SizedBox(width: 12.w),
          const Expanded(
            child: Text(
              'Your profile is incomplete. Complete it so students can find you.',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
          SizedBox(width: 8.w),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.accent,
              padding: EdgeInsets.symmetric(horizontal: 14.w),
            ),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const MentorProfileScreen()),
            ),
            child: const Text('Update'),
          ),
        ],
      ),
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 20.sp,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12.5.sp, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}
