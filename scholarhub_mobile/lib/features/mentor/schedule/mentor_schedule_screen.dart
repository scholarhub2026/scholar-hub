import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking.dart';
import '../../../state/view_status.dart';
import '../../../widgets/state_views.dart';
import '../mentor_bookings_cubit.dart';
import 'session_log_sheet.dart';

class MentorScheduleScreen extends StatelessWidget {
  const MentorScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MentorBookingsCubit, MentorBookingsState>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading && state.bookings.isEmpty) {
          return const ShimmerList(itemHeight: 140);
        }
        if (state.status == ViewStatus.failure && state.bookings.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load your schedule.',
            onRetry: () => context.read<MentorBookingsCubit>().load(),
          );
        }
        if (state.bookings.isEmpty) {
          return const EmptyState(
            icon: LucideIcons.calendarCheck,
            title: 'No sessions yet',
            message: 'Your confirmed sessions will appear here.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => context.read<MentorBookingsCubit>().load(),
          child: ListView.separated(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 120.h),
            itemCount: state.bookings.length,
            separatorBuilder: (_, _) => SizedBox(height: 12.h),
            itemBuilder: (_, i) => _ScheduleCard(booking: state.bookings[i]),
          ),
        );
      },
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  final Booking booking;
  const _ScheduleCard({required this.booking});

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
        children: [
          Row(
            children: [
              Container(
                height: 44.h,
                width: 44.w,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(14.r),
                ),
                child: const Icon(LucideIcons.user, color: Colors.white),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.studentName.isEmpty
                          ? 'Student'
                          : booking.studentName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      booking.selectedSyllabus.isEmpty
                          ? Formatters.date(booking.createdAt)
                          : '${booking.selectedSyllabus} · ${Formatters.date(booking.createdAt)}',
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
              _statusChip(booking.bookingStatus),
            ],
          ),
          if (booking.selectedSubjects.isNotEmpty) ...[
            SizedBox(height: 10.h),
            Text(
              booking.selectedSubjects.join(' · '),
              style: TextStyle(
                fontSize: 12.5.sp,
                color: AppColors.textSecondary,
              ),
            ),
          ],
          SizedBox(height: 12.h),
          Row(
            children: [
              Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Text(
                  '${booking.logs.length} log${booking.logs.length == 1 ? '' : 's'}',
                  style: TextStyle(
                    fontSize: 11.5.sp,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: () => showSessionLogSheet(context, booking.id),
                icon: Icon(LucideIcons.clipboardList, size: 16.sp),
                label: const Text('Session logs'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String s) {
    Color color;
    switch (s) {
      case 'confirmed':
        color = AppColors.primary;
        break;
      case 'completed':
        color = AppColors.success;
        break;
      case 'cancelled':
        color = AppColors.danger;
        break;
      default:
        color = AppColors.warning;
    }
    final label = s.isEmpty ? '—' : s[0].toUpperCase() + s.substring(1);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11.5.sp,
        ),
      ),
    );
  }
}
