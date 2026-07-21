import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/enquiry.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_enquiries_cubit.dart';
import 'create_booking_sheet.dart';

/// Admin inbox for class enquiries (the lead front-door). Scope chips filter by
/// status; each lead can be converted into a confirmed booking.
class AdminEnquiriesScreen extends StatelessWidget {
  const AdminEnquiriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminEnquiriesCubit()..load(),
      child: const _EnquiriesView(),
    );
  }
}

class _EnquiriesView extends StatelessWidget {
  const _EnquiriesView();

  Future<void> _createBooking(
      BuildContext context, EnquiryRecord enquiry) async {
    final cubit = context.read<AdminEnquiriesCubit>();
    final result = await showCreateBookingSheet(context, enquiry: enquiry);
    if (result == null) return;
    try {
      await cubit.createBooking(
        enquiry: enquiry,
        totalAmount: result['totalAmount'] as num,
        paymentFrequency: result['paymentFrequency'] as String,
        classStartDate: result['classStartDate'] as String,
      );
      if (context.mounted) {
        AppSnackbar.success(context, 'Booking created for ${enquiry.studentName}.');
      }
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) {
        AppSnackbar.error(context, 'Unable to create the booking.');
      }
    }
  }

  Future<void> _setStatus(
      BuildContext context, EnquiryRecord enquiry, String status) async {
    final cubit = context.read<AdminEnquiriesCubit>();
    try {
      await cubit.updateStatus(enquiry.id, status);
      if (context.mounted) AppSnackbar.success(context, 'Enquiry updated.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminEnquiriesCubit, AdminEnquiriesState>(
      builder: (context, state) {
        return Column(
          children: [
            _ScopeBar(state: state),
            Expanded(child: _list(context, state)),
          ],
        );
      },
    );
  }

  Widget _list(BuildContext context, AdminEnquiriesState state) {
    final cubit = context.read<AdminEnquiriesCubit>();
    if (state.status.isLoading && state.items.isEmpty) {
      return const ShimmerList(itemHeight: 150);
    }
    if (state.status.isFailure && state.items.isEmpty) {
      return ErrorStateView(
        message: state.error ?? 'Unable to load enquiries.',
        onRetry: () => cubit.load(),
      );
    }
    if (state.items.isEmpty) {
      return EmptyState(
        icon: LucideIcons.inbox,
        title: 'No enquiries',
        message: state.scope == 'new'
            ? 'New enquiries from the app will appear here.'
            : 'Nothing in this view right now.',
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => cubit.load(),
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
                    ? const CircularProgressIndicator(color: AppColors.primary)
                    : OutlinedButton(
                        onPressed: () => cubit.loadMore(),
                        child: const Text('Load more'),
                      ),
              ),
            );
          }
          final item = state.items[i];
          return _EnquiryCard(
            enquiry: item,
            onCreateBooking: () => _createBooking(context, item),
            onMarkContacted: () => _setStatus(context, item, 'contacted'),
            onClose: () => _setStatus(context, item, 'closed'),
          );
        },
      ),
    );
  }
}

class _ScopeBar extends StatelessWidget {
  final AdminEnquiriesState state;
  const _ScopeBar({required this.state});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminEnquiriesCubit>();
    final scopes = <(String, String, int?)>[
      ('new', 'New', state.newCount),
      ('contacted', 'Contacted', state.contacted),
      ('converted', 'Converted', state.converted),
      ('closed', 'Closed', state.closed),
      ('all', 'All', null),
    ];
    return SizedBox(
      height: 56.h,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
        itemCount: scopes.length,
        separatorBuilder: (_, _) => SizedBox(width: 8.w),
        itemBuilder: (_, i) {
          final (key, label, count) = scopes[i];
          final selected = state.scope == key;
          return GestureDetector(
            onTap: () => cubit.load(scope: key),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: EdgeInsets.symmetric(horizontal: 14.w),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: selected ? AppColors.brandGradient : null,
                color: selected ? null : AppColors.surface,
                borderRadius: BorderRadius.circular(20.r),
                border: Border.all(
                  color: selected ? Colors.transparent : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13.sp,
                      color: selected ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  if (count != null && count > 0) ...[
                    SizedBox(width: 6.w),
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 6.w, vertical: 1.h),
                      decoration: BoxDecoration(
                        color: selected
                            ? Colors.white.withValues(alpha: 0.25)
                            : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      child: Text(
                        '$count',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 11.sp,
                          color: selected ? Colors.white : AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

Color _enquiryStatusColor(String status) {
  switch (status) {
    case 'contacted':
      return AppColors.primary;
    case 'converted':
      return AppColors.success;
    case 'closed':
      return AppColors.textMuted;
    default:
      return AppColors.warning; // new
  }
}

String _enquiryStatusLabel(String status) {
  switch (status) {
    case 'contacted':
      return 'Contacted';
    case 'converted':
      return 'Converted';
    case 'closed':
      return 'Closed';
    default:
      return 'New';
  }
}

class _EnquiryCard extends StatelessWidget {
  final EnquiryRecord enquiry;
  final VoidCallback onCreateBooking;
  final VoidCallback onMarkContacted;
  final VoidCallback onClose;

  const _EnquiryCard({
    required this.enquiry,
    required this.onCreateBooking,
    required this.onMarkContacted,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final subjects = enquiry.subjects.map((s) => s.name).join(', ');
    final classLabel = enquiry.isDemo
        ? 'Demo class'
        : (enquiry.className.isEmpty ? 'Class enquiry' : enquiry.className);
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
                height: 42.h,
                width: 42.w,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(13.r),
                ),
                child: Text(
                  enquiry.studentName.isNotEmpty
                      ? enquiry.studentName[0].toUpperCase()
                      : '?',
                  style: const TextStyle(
                    color: Colors.white,
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
                      enquiry.studentName.isEmpty
                          ? 'Unknown'
                          : enquiry.studentName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (enquiry.phone.isNotEmpty)
                      Text(
                        enquiry.phone,
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
              _StatusChip(status: enquiry.status),
            ],
          ),
          SizedBox(height: 12.h),
          _row(LucideIcons.graduationCap,
              '${enquiry.mentorName.isEmpty ? 'Mentor' : enquiry.mentorName} · $classLabel'),
          if (!enquiry.isDemo && subjects.isNotEmpty)
            _row(LucideIcons.bookOpen, subjects),
          if (enquiry.message.trim().isNotEmpty)
            _row(LucideIcons.messageSquare, enquiry.message.trim()),
          SizedBox(height: 12.h),
          Row(
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: enquiry.isDemo
                      ? AppColors.successSoft
                      : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Text(
                  enquiry.isDemo
                      ? 'Free'
                      : Formatters.rupeesPlain(enquiry.estimatedAmount),
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13.sp,
                    color:
                        enquiry.isDemo ? AppColors.success : AppColors.primary,
                  ),
                ),
              ),
              const Spacer(),
              if (enquiry.createdAt != null)
                Text(
                  Formatters.date(enquiry.createdAt),
                  style: TextStyle(
                    fontSize: 11.5.sp,
                    color: AppColors.textMuted,
                  ),
                ),
            ],
          ),
          SizedBox(height: 12.h),
          _actions(),
        ],
      ),
    );
  }

  Widget _actions() {
    if (enquiry.isConverted) {
      return Row(
        children: [
          Icon(LucideIcons.checkCircle2, size: 16.sp, color: AppColors.success),
          SizedBox(width: 8.w),
          Text(
            'Converted to a booking',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 12.5.sp,
              color: AppColors.success,
            ),
          ),
        ],
      );
    }
    final secondary = <Widget>[
      if (enquiry.status == 'new')
        OutlinedButton.icon(
          onPressed: onMarkContacted,
          icon: Icon(LucideIcons.phoneCall, size: 16.sp),
          label: const Text('Contacted'),
        ),
      if (enquiry.status != 'closed')
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
          onPressed: onClose,
          icon: Icon(LucideIcons.x, size: 16.sp),
          label: const Text('Close'),
        ),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton.icon(
          onPressed: onCreateBooking,
          icon: Icon(LucideIcons.calendarCheck, size: 16.sp),
          label: const Text('Create booking'),
        ),
        if (secondary.isNotEmpty) ...[
          SizedBox(height: 10.h),
          Row(
            children: [
              for (var i = 0; i < secondary.length; i++) ...[
                if (i > 0) SizedBox(width: 10.w),
                Expanded(child: secondary[i]),
              ],
            ],
          ),
        ],
      ],
    );
  }

  Widget _row(IconData icon, String text) {
    return Padding(
      padding: EdgeInsets.only(top: 4.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.only(top: 2.h),
            child: Icon(icon, size: 14.sp, color: AppColors.textMuted),
          ),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(
              text,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12.5.sp,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = _enquiryStatusColor(status);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        _enquiryStatusLabel(status),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11.5.sp,
        ),
      ),
    );
  }
}
