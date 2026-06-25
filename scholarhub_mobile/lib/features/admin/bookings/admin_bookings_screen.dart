import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking.dart';
import '../../../data/services/booking_service.dart';
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

  Future<void> _paymentLink(BuildContext context, Booking booking) async {
    try {
      final url = await BookingService().createPaymentLink(
        amount: booking.totalAmount,
        name: booking.studentName.isEmpty ? 'Student' : booking.studentName,
        email: booking.email,
        contact: booking.phone,
        orderId: booking.id,
      );
      if (url == null || url.isEmpty) {
        if (context.mounted) {
          AppSnackbar.error(context, 'Could not create a payment link.');
        }
        return;
      }
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) {
        AppSnackbar.error(context, 'Could not create a payment link.');
      }
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
                      onPaymentLink: () => _paymentLink(context, b),
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
  final VoidCallback onPaymentLink;

  const _BookingCard({
    required this.booking,
    required this.onEdit,
    required this.onPaymentLink,
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
                Formatters.rupeesPlain(booking.totalAmount),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16.sp,
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
              _chip(_cap(booking.bookingStatus), _bookingColor(booking.bookingStatus)),
              _chip('Payment: ${_cap(booking.paymentStatus)}',
                  _paymentColor(booking.paymentStatus)),
              if (booking.createdAt != null)
                _chip(Formatters.date(booking.createdAt), AppColors.textMuted),
            ],
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: Icon(LucideIcons.pencil, size: 16.sp),
                  label: const Text('Edit'),
                ),
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onPaymentLink,
                  icon: Icon(LucideIcons.link, size: 16.sp),
                  label: const Text('Payment link'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _cap(String s) =>
      s.isEmpty ? '—' : s[0].toUpperCase() + s.substring(1);

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
      case 'confirmed':
        return AppColors.primary;
      case 'completed':
        return AppColors.success;
      case 'cancelled':
        return AppColors.danger;
      default:
        return AppColors.warning;
    }
  }

  Color _paymentColor(String s) {
    switch (s) {
      case 'completed':
        return AppColors.success;
      case 'failed':
        return AppColors.danger;
      default:
        return AppColors.warning;
    }
  }
}
