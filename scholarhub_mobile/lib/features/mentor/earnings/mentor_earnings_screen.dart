import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../state/view_status.dart';
import '../../../widgets/state_views.dart';
import '../mentor_bookings_cubit.dart';

class MentorEarningsScreen extends StatelessWidget {
  const MentorEarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MentorBookingsCubit, MentorBookingsState>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading && state.bookings.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }
        if (state.status == ViewStatus.failure && state.bookings.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load earnings.',
            onRetry: () => context.read<MentorBookingsCubit>().load(),
          );
        }
        final paid = state.bookings
            .where((b) => b.paymentStatus == 'completed')
            .toList();
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => context.read<MentorBookingsCubit>().load(),
          child: ListView(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 120.h),
            children: [
              Container(
                padding: EdgeInsets.all(22.r),
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(24.r),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total earnings',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 13.5.sp,
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Text(
                      Formatters.rupeesPlain(state.totalEarnings),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 34.sp,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 14.h),
              Row(
                children: [
                  Expanded(
                    child: _MiniStat(
                      icon: LucideIcons.clock,
                      label: 'Pending',
                      value: Formatters.rupeesPlain(state.pendingEarnings),
                      color: AppColors.warning,
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: _MiniStat(
                      icon: LucideIcons.checkCircle2,
                      label: 'Completed',
                      value: '${state.completedSessions}',
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 24.h),
              Text(
                'Paid bookings',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 12.h),
              if (paid.isEmpty)
                Container(
                  padding: EdgeInsets.all(20.r),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18.r),
                  ),
                  child: const Center(
                    child: Text(
                      'No paid bookings yet.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                )
              else
                ...paid.map(
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
                            height: 38.h,
                            width: 38.w,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppColors.successSoft,
                              borderRadius: BorderRadius.circular(11.r),
                            ),
                            child: Icon(LucideIcons.indianRupee,
                                color: AppColors.success, size: 18.sp),
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
                              color: AppColors.success,
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

class _MiniStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _MiniStat({
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
        borderRadius: BorderRadius.circular(18.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22.sp),
          SizedBox(height: 10.h),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18.sp,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}
