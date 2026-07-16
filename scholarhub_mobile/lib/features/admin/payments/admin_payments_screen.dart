import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import 'admin_payments_cubit.dart';

class AdminPaymentsScreen extends StatelessWidget {
  const AdminPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminPaymentsCubit()..load(),
      child: const _PaymentsView(),
    );
  }
}

class _PaymentsView extends StatelessWidget {
  const _PaymentsView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminPaymentsCubit, AdminPaymentsState>(
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

  Widget _list(BuildContext context, AdminPaymentsState state) {
    final cubit = context.read<AdminPaymentsCubit>();
    if (state.status.isLoading && state.items.isEmpty) {
      return const ShimmerList(itemHeight: 130);
    }
    if (state.status.isFailure && state.items.isEmpty) {
      return ErrorStateView(
        message: state.error ?? 'Unable to load payments.',
        onRetry: () => cubit.load(),
      );
    }
    if (state.items.isEmpty) {
      return EmptyState(
        icon: LucideIcons.wallet,
        title: 'Nothing due',
        message: state.scope == 'all'
            ? 'Payments for confirmed bookings will show up here.'
            : 'Nothing in this view right now. 🎉',
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
          return _PaymentCard(
            booking: state.items[i],
            onMarkPaid: () => _markPaid(context, state.items[i]),
            onHistory: () => _history(context, state.items[i]),
          );
        },
      ),
    );
  }

  Future<void> _markPaid(BuildContext context, Booking booking) async {
    final cubit = context.read<AdminPaymentsCubit>();
    final amountCtrl = TextEditingController(
        text: booking.totalAmount.toStringAsFixed(0));
    final noteCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Record payment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'From ${booking.studentName}. The next due date moves forward '
              'one ${booking.frequencyPerLabel.isEmpty ? 'period' : booking.frequencyPerLabel}.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
            ),
            SizedBox(height: 14.h),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                labelText: 'Amount (₹)',
                prefixText: '₹ ',
              ),
            ),
            SizedBox(height: 12.h),
            TextField(
              controller: noteCtrl,
              decoration: const InputDecoration(
                labelText: 'Note (optional)',
                hintText: 'cash, UPI, partial…',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Record')),
        ],
      ),
    );
    if (ok != true) return;
    final amount = num.tryParse(amountCtrl.text.trim());
    final note = noteCtrl.text.trim();
    try {
      await cubit.markPaid(booking.id,
          amount: amount, note: note.isEmpty ? null : note);
      if (context.mounted) AppSnackbar.success(context, 'Payment recorded.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) {
        AppSnackbar.error(context, 'Unable to record the payment.');
      }
    }
  }

  Future<void> _history(BuildContext context, Booking booking) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
        ),
        padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  height: 5.h,
                  width: 44.w,
                  margin: EdgeInsets.only(bottom: 16.h),
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(3.r),
                  ),
                ),
              ),
              Text('Payment history',
                  style:
                      TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp)),
              SizedBox(height: 4.h),
              Text(booking.studentName,
                  style:
                      TextStyle(color: AppColors.textMuted, fontSize: 13.sp)),
              SizedBox(height: 14.h),
              if (booking.payments.isEmpty)
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 16.h),
                  child: const Text('No payments recorded yet.',
                      style: TextStyle(color: AppColors.textMuted)),
                )
              else
                ...booking.payments.reversed.map(
                  (p) => Padding(
                    padding: EdgeInsets.only(bottom: 8.h),
                    child: Container(
                      padding: EdgeInsets.all(12.r),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.periodLabel.isEmpty
                                      ? Formatters.date(p.collectedAt)
                                      : p.periodLabel,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700),
                                ),
                                Text(
                                  '${Formatters.date(p.collectedAt)}${p.note.isEmpty ? '' : ' · ${p.note}'}',
                                  style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12.sp,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            Formatters.rupeesPlain(p.amount),
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
        ),
      ),
    );
  }
}

class _ScopeBar extends StatelessWidget {
  final AdminPaymentsState state;
  const _ScopeBar({required this.state});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminPaymentsCubit>();
    final scopes = <(String, String, int?)>[
      ('all', 'All', null),
      ('overdue', 'Overdue', state.overdue),
      ('today', 'Due today', state.dueToday),
      ('upcoming', 'Upcoming', state.upcoming),
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

class _PaymentCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback onMarkPaid;
  final VoidCallback onHistory;

  const _PaymentCard({
    required this.booking,
    required this.onMarkPaid,
    required this.onHistory,
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
                          fontWeight: FontWeight.w700, fontSize: 15.sp),
                    ),
                    Text(
                      'Mentor: ${booking.mentorName.isEmpty ? '—' : booking.mentorName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 12.5.sp),
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
          _dueChip(),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: onMarkPaid,
                  icon: Icon(LucideIcons.checkCircle2, size: 16.sp),
                  label: const Text('Mark paid'),
                ),
              ),
              SizedBox(width: 10.w),
              OutlinedButton.icon(
                onPressed: onHistory,
                icon: Icon(LucideIcons.history, size: 16.sp),
                label: Text('${booking.payments.length}'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dueChip() {
    late final Color color;
    late final String label;
    switch (booking.dueStatus) {
      case 'overdue':
        color = AppColors.danger;
        label = booking.daysOverdue > 0
            ? '${booking.daysOverdue}d overdue'
            : 'Overdue';
        break;
      case 'today':
        color = AppColors.warning;
        label = 'Due today';
        break;
      default:
        color = AppColors.textMuted;
        label = 'Due ${Formatters.date(booking.nextDueDate)}';
    }
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
