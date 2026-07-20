import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'mentor_requests_cubit.dart';

class MentorRequestsScreen extends StatelessWidget {
  const MentorRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => MentorRequestsCubit()..load(),
      child: const _RequestsView(),
    );
  }
}

class _RequestsView extends StatelessWidget {
  const _RequestsView();

  Future<void> _accept(BuildContext context, Booking booking) async {
    final cubit = context.read<MentorRequestsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Accept booking?'),
        content: const Text(
          'Accepting confirms the booking and freezes the agreed fees. You can '
          'then log sessions for it.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Accept')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.accept(booking.id);
      if (context.mounted) AppSnackbar.success(context, 'Booking accepted.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to accept.');
    }
  }

  Future<void> _decline(BuildContext context, Booking booking) async {
    final cubit = context.read<MentorRequestsCubit>();
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Decline booking?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('The team will be notified. Add a reason (optional):'),
            SizedBox(height: 12.h),
            TextField(
              controller: controller,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'e.g. Slot no longer available',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Decline'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final reason = controller.text.trim();
    try {
      await cubit.decline(booking.id, reason.isEmpty ? null : reason);
      if (context.mounted) AppSnackbar.success(context, 'Booking declined.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to decline.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MentorRequestsCubit, MentorRequestsState>(
      builder: (context, state) {
        final cubit = context.read<MentorRequestsCubit>();
        if (state.status == ViewStatus.loading && state.requests.isEmpty) {
          return const ShimmerList(itemHeight: 180);
        }
        if (state.status == ViewStatus.failure && state.requests.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load requests.',
            onRetry: () => cubit.load(),
          );
        }
        if (state.requests.isEmpty) {
          return const EmptyState(
            icon: LucideIcons.inbox,
            title: 'No pending requests',
            message: 'Approved bookings waiting for your acceptance appear here.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => cubit.load(),
          child: ListView.separated(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 120.h),
            itemCount: state.requests.length,
            separatorBuilder: (_, _) => SizedBox(height: 12.h),
            itemBuilder: (_, i) => _RequestCard(
              booking: state.requests[i],
              onAccept: () => _accept(context, state.requests[i]),
              onDecline: () => _decline(context, state.requests[i]),
            ),
          ),
        );
      },
    );
  }
}

class _RequestCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _RequestCard({
    required this.booking,
    required this.onAccept,
    required this.onDecline,
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
                child: const Icon(LucideIcons.userPlus, color: Colors.white),
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
                    if (booking.phone.isNotEmpty || booking.email.isNotEmpty)
                      Text(
                        [booking.phone, booking.email]
                            .where((e) => e.isNotEmpty)
                            .join(' · '),
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
          SizedBox(height: 12.h),
          _infoRow(LucideIcons.graduationCap, _classLine()),
          if (booking.selectedSubjects.isNotEmpty)
            _infoRow(LucideIcons.bookOpen, booking.selectedSubjects.join(' · ')),
          if (booking.reservedSlots.isNotEmpty)
            _infoRow(LucideIcons.calendarClock,
                booking.reservedSlots.map((s) => s.label).join('  •  ')),
          _infoRow(
            LucideIcons.repeat,
            booking.frequencyPerLabel.isEmpty
                ? 'Billing per session'
                : 'Billed per ${booking.frequencyPerLabel}',
          ),
          if (booking.classStartDate != null)
            _infoRow(LucideIcons.calendarCheck,
                'Starts ${Formatters.date(booking.classStartDate)}'),
          if (booking.message.isNotEmpty) ...[
            SizedBox(height: 8.h),
            Container(
              padding: EdgeInsets.all(12.r),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Text(
                booking.message,
                style: TextStyle(
                    fontSize: 12.5.sp, color: AppColors.textSecondary),
              ),
            ),
          ],
          SizedBox(height: 14.h),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: onAccept,
                  icon: Icon(LucideIcons.check, size: 16.sp),
                  label: const Text('Accept'),
                ),
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: OutlinedButton.icon(
                  style:
                      OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                  onPressed: onDecline,
                  icon: Icon(LucideIcons.x, size: 16.sp),
                  label: const Text('Decline'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _classLine() {
    final parts = <String>[];
    if (booking.selectedSyllabus.isNotEmpty) parts.add(booking.selectedSyllabus);
    if (booking.bookingType.isNotEmpty) {
      parts.add(booking.bookingType[0].toUpperCase() +
          booking.bookingType.substring(1));
    }
    return parts.isEmpty ? 'Booking request' : parts.join(' · ');
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: EdgeInsets.only(top: 6.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14.sp, color: AppColors.primary),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 12.5.sp, color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
