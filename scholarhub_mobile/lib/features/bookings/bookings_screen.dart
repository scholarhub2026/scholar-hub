import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/booking.dart';
import '../../data/services/booking_service.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/state_views.dart';

class BookingsScreen extends StatefulWidget {
  /// Switches the shell to the Mentors tab (used by the empty-state CTA).
  final VoidCallback onBrowseMentors;

  const BookingsScreen({super.key, required this.onBrowseMentors});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  final BookingService _service = BookingService();

  String? _loadedFor;
  bool _loading = false;
  String? _error;
  List<Booking> _bookings = [];

  Future<void> _load(String studentId) async {
    setState(() {
      _loading = true;
      _error = null;
      _loadedFor = studentId;
    });
    try {
      final result = await _service.getStudentBookings(studentId);
      if (!mounted) return;
      setState(() {
        _bookings = result.bookings;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthCubit>().state;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Bookings'),
        automaticallyImplyLeading: false,
      ),
      body: auth.isAuthenticated
          ? _buildAuthed(auth.user!.id)
          : _buildSignedOut(),
    );
  }

  Widget _buildAuthed(String studentId) {
    // Kick off a load the first time we see this user.
    if (_loadedFor != studentId && !_loading) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _loadedFor != studentId) _load(studentId);
      });
    }
    if (_loading) return ShimmerList(itemHeight: 120.h);
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: () => _load(studentId));
    }
    if (_bookings.isEmpty) {
      return EmptyState(
        icon: LucideIcons.calendarX,
        title: 'No bookings yet',
        message: 'Your booked sessions will show up here.',
        actionLabel: 'Find a mentor',
        onAction: widget.onBrowseMentors,
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => _load(studentId),
      child: ListView.separated(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 120.h),
        itemCount: _bookings.length,
        separatorBuilder: (_, _) => SizedBox(height: 14.h),
        itemBuilder: (_, i) => _BookingCard(booking: _bookings[i]),
      ),
    );
  }

  Widget _buildSignedOut() {
    return EmptyState(
      icon: LucideIcons.calendarCheck,
      title: 'Sign in to see your sessions',
      message: 'Sign in to track your bookings, payments and session history.',
      actionLabel: 'Sign In',
      onAction: () => AppNavigator.toLogin(context),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22.r),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withValues(alpha: 0.05),
            blurRadius: 18,
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
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(14.r),
                ),
                child: Icon(LucideIcons.graduationCap,
                    color: Colors.white, size: 22.sp),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.mentorName.isEmpty
                          ? 'Scholar Hub Mentor'
                          : booking.mentorName,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      Formatters.date(booking.createdAt),
                      style: TextStyle(
                        fontSize: 12.sp,
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
          SizedBox(height: 14.h),
          Row(
            children: [
              _StatusChip(
                label: 'Booking: ${_label(booking.bookingStatus)}',
                color: _statusColor(booking.bookingStatus),
              ),
              SizedBox(width: 8.w),
              _StatusChip(
                label: 'Payment: ${_label(booking.paymentStatus)}',
                color: _paymentColor(booking.paymentStatus),
              ),
            ],
          ),
          if (booking.selectedSubjects.isNotEmpty) ...[
            SizedBox(height: 12.h),
            Text(
              booking.selectedSubjects.join(' · '),
              style: TextStyle(
                fontSize: 12.5.sp,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _label(String s) =>
      s.isEmpty ? '—' : s[0].toUpperCase() + s.substring(1);

  Color _statusColor(String s) {
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

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
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
