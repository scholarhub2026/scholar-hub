import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking.dart';
import '../../../state/auth/auth_cubit.dart';
import '../../../state/paged_state.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_bookings_cubit.dart';
import 'edit_booking_sheet.dart';

class AdminBookingsScreen extends StatelessWidget {
  const AdminBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final adminId = context.read<AuthCubit>().state.user?.id ?? '';
    return BlocProvider(
      create: (_) => AdminBookingsCubit(adminId)..load(),
      child: const _BookingsView(),
    );
  }
}

class _BookingsView extends StatefulWidget {
  const _BookingsView();

  @override
  State<_BookingsView> createState() => _BookingsViewState();
}

class _BookingsViewState extends State<_BookingsView> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _edit(BuildContext context, Booking booking) async {
    final cubit = context.read<AdminBookingsCubit>();
    final payload = await showEditBookingSheet(context, booking: booking);
    if (payload == null) return;
    try {
      await cubit.updateBooking(booking.id, payload);
      if (context.mounted) AppSnackbar.success(context, 'Booking updated.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  Future<void> _approve(BuildContext context, Booking booking) async {
    final cubit = context.read<AdminBookingsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Approve booking?'),
        content: const Text(
          'The student and mentor will be notified and the payment schedule '
          'will start.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Approve')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.approve(booking.id);
      if (context.mounted) AppSnackbar.success(context, 'Booking approved.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to approve.');
    }
  }

  Future<void> _complete(BuildContext context, Booking booking) async {
    final cubit = context.read<AdminBookingsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Mark as completed?'),
        content: const Text(
          'This raises the final invoice for any unbilled verified sessions.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Complete')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.complete(booking.id);
      if (context.mounted) AppSnackbar.success(context, 'Booking completed.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to complete.');
    }
  }

  Future<void> _close(BuildContext context, Booking booking) async {
    final cubit = context.read<AdminBookingsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Close booking?'),
        content: const Text(
          'Only close once every invoice for this booking is settled.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Close')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.closeBooking(booking.id);
      if (context.mounted) AppSnackbar.success(context, 'Booking closed.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to close.');
    }
  }

  Future<void> _reject(BuildContext context, Booking booking) async {
    final cubit = context.read<AdminBookingsCubit>();
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reject booking?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('The student will be notified. Add a reason (optional):'),
            SizedBox(height: 12.h),
            TextField(
              controller: controller,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'e.g. Mentor unavailable this term',
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
            child: const Text('Reject'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final reason = controller.text.trim();
    try {
      await cubit.reject(booking.id, reason.isEmpty ? null : reason);
      if (context.mounted) AppSnackbar.success(context, 'Booking rejected.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to reject.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 8.h),
          child: TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: (v) =>
                context.read<AdminBookingsCubit>().load(search: v.trim()),
            decoration: InputDecoration(
              hintText: 'Search by student or mentor…',
              prefixIcon: Icon(LucideIcons.search, size: 20.sp),
              suffixIcon: _searchController.text.isEmpty
                  ? null
                  : IconButton(
                      icon: Icon(LucideIcons.x, size: 18.sp),
                      onPressed: () {
                        _searchController.clear();
                        context.read<AdminBookingsCubit>().load(search: '');
                        setState(() {});
                      },
                    ),
            ),
          ),
        ),
        Expanded(
          child: BlocBuilder<AdminBookingsCubit, PagedState<Booking>>(
            builder: (context, state) {
              if (state.status == ViewStatus.loading && state.items.isEmpty) {
                return const ShimmerList(itemHeight: 150);
              }
              if (state.status == ViewStatus.failure && state.items.isEmpty) {
                return ErrorStateView(
                  message: state.error ?? 'Unable to load bookings.',
                  onRetry: () => context.read<AdminBookingsCubit>().load(),
                );
              }
              if (state.items.isEmpty) {
                return const EmptyState(
                  icon: LucideIcons.calendarX,
                  title: 'No bookings found',
                  message: 'Bookings will appear here as students book sessions.',
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () => context.read<AdminBookingsCubit>().load(),
                child: ListView.separated(
                  padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 32.h),
                  itemCount: state.items.length + (state.hasMore ? 1 : 0),
                  separatorBuilder: (_, _) => SizedBox(height: 12.h),
                  itemBuilder: (context, i) {
                    if (i >= state.items.length) {
                      return Center(
                        child: Padding(
                          padding: EdgeInsets.all(8.r),
                          child: state.loadingMore
                              ? const CircularProgressIndicator(
                                  color: AppColors.primary)
                              : OutlinedButton(
                                  onPressed: () => context
                                      .read<AdminBookingsCubit>()
                                      .loadMore(),
                                  child: const Text('Load more'),
                                ),
                        ),
                      );
                    }
                    final b = state.items[i];
                    return _BookingCard(
                      booking: b,
                      onEdit: () => _edit(context, b),
                      onApprove: () => _approve(context, b),
                      onReject: () => _reject(context, b),
                      onComplete: () => _complete(context, b),
                      onClose: () => _close(context, b),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback onEdit;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final VoidCallback onComplete;
  final VoidCallback onClose;

  const _BookingCard({
    required this.booking,
    required this.onEdit,
    required this.onApprove,
    required this.onReject,
    required this.onComplete,
    required this.onClose,
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
                      'Mentor: ${booking.mentorName.isEmpty ? '—' : booking.mentorName}',
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
              Text(
                booking.frequencyPerLabel.isEmpty
                    ? Formatters.rupeesPlain(booking.totalAmount)
                    : '${Formatters.rupeesPlain(booking.totalAmount)}/${booking.frequencyPerLabel}',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15.sp,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _chip(_statusLabel(booking.bookingStatus),
                  _bookingColor(booking.bookingStatus)),
              if (booking.bookingStatus == 'confirmed' &&
                  booking.nextDueDate != null)
                _chip('Due ${Formatters.date(booking.nextDueDate)}',
                    AppColors.warning),
              if (booking.createdAt != null)
                _chip(Formatters.date(booking.createdAt), AppColors.textMuted),
            ],
          ),
          SizedBox(height: 12.h),
          _actions(),
        ],
      ),
    );
  }

  Widget _actions() {
    switch (booking.bookingStatus) {
      case 'pending':
        return Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: onApprove,
                icon: Icon(LucideIcons.check, size: 16.sp),
                label: const Text('Approve'),
              ),
            ),
            SizedBox(width: 10.w),
            Expanded(
              child: OutlinedButton.icon(
                style:
                    OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                onPressed: onReject,
                icon: Icon(LucideIcons.x, size: 16.sp),
                label: const Text('Reject'),
              ),
            ),
          ],
        );
      case 'confirmed':
        return Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: onComplete,
                icon: Icon(LucideIcons.flagTriangleRight, size: 16.sp),
                label: const Text('Complete'),
              ),
            ),
            SizedBox(width: 10.w),
            _editButton(expand: false),
          ],
        );
      case 'completed':
        return Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: onClose,
                icon: Icon(LucideIcons.lock, size: 16.sp),
                label: const Text('Close'),
              ),
            ),
            SizedBox(width: 10.w),
            _editButton(expand: false),
          ],
        );
      default:
        return _editButton(expand: true);
    }
  }

  Widget _editButton({required bool expand}) {
    final button = OutlinedButton.icon(
      onPressed: onEdit,
      icon: Icon(LucideIcons.pencil, size: 16.sp),
      label: const Text('Edit'),
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }

  String _statusLabel(String s) {
    if (s == 'approved') return 'Awaiting teacher';
    return s.isEmpty ? '—' : s[0].toUpperCase() + s.substring(1);
  }

  Widget _chip(String label, Color color) {
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

  Color _bookingColor(String s) {
    switch (s) {
      case 'approved':
        return AppColors.accent;
      case 'confirmed':
        return AppColors.primary;
      case 'completed':
        return AppColors.success;
      case 'closed':
        return AppColors.textSecondary;
      case 'cancelled':
        return AppColors.danger;
      default:
        return AppColors.warning;
    }
  }
}
