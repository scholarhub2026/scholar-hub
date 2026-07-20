import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../data/models/booking.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_invoices_cubit.dart';
import 'admin_payments_cubit.dart';

/// Admin billing: the SRD "Invoices" flow plus the pre-rework "Legacy"
/// due-payment collection kept for older bookings.
class AdminPaymentsScreen extends StatelessWidget {
  const AdminPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Material(
            color: AppColors.background,
            child: TabBar(
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textMuted,
              indicatorColor: AppColors.primary,
              labelStyle: TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 13.5.sp),
              tabs: const [
                Tab(text: 'Invoices'),
                Tab(text: 'Legacy'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                BlocProvider(
                  create: (_) => AdminInvoicesCubit()..load(),
                  child: const _InvoicesView(),
                ),
                BlocProvider(
                  create: (_) => AdminPaymentsCubit()..load(),
                  child: const _PaymentsView(),
                ),
              ],
            ),
          ),
        ],
      ),
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

// ---------------------------------------------------------------------------
// Invoices tab (SRD billing)
// ---------------------------------------------------------------------------

const _invoiceMethods = ['cash', 'upi', 'bank-transfer', 'other'];

class _InvoicesView extends StatelessWidget {
  const _InvoicesView();

  Future<void> _recordPayment(BuildContext context, InvoiceRecord invoice) async {
    final cubit = context.read<AdminInvoicesCubit>();
    final result = await showModalBottomSheet<Map<String, String?>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: _RecordPaymentSheet(invoice: invoice),
      ),
    );
    if (result == null) return;
    try {
      await cubit.recordPayment(
        invoice.id,
        method: result['method']!,
        note: result['note'],
      );
      if (context.mounted) {
        AppSnackbar.success(context, 'Payment recorded. Receipt emailed.');
      }
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to record.');
    }
  }

  Future<void> _void(BuildContext context, InvoiceRecord invoice) async {
    final cubit = context.read<AdminInvoicesCubit>();
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Void invoice?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('The invoice will be cancelled. Add a reason (optional):'),
            SizedBox(height: 12.h),
            TextField(
              controller: controller,
              maxLines: 2,
              decoration: const InputDecoration(hintText: 'Reason'),
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
            child: const Text('Void'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final reason = controller.text.trim();
    try {
      await cubit.voidInvoice(invoice.id, reason.isEmpty ? null : reason);
      if (context.mounted) AppSnackbar.success(context, 'Invoice voided.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to void.');
    }
  }

  Future<void> _resend(BuildContext context, InvoiceRecord invoice) async {
    final cubit = context.read<AdminInvoicesCubit>();
    try {
      await cubit.resendReceipt(invoice.id);
      if (context.mounted) AppSnackbar.success(context, 'Receipt re-sent.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to resend.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminInvoicesCubit, AdminInvoicesState>(
      builder: (context, state) {
        return Column(
          children: [
            _InvoiceScopeBar(state: state),
            Expanded(child: _list(context, state)),
          ],
        );
      },
    );
  }

  Widget _list(BuildContext context, AdminInvoicesState state) {
    final cubit = context.read<AdminInvoicesCubit>();
    if (state.status == ViewStatus.loading && state.items.isEmpty) {
      return const ShimmerList(itemHeight: 130);
    }
    if (state.status == ViewStatus.failure && state.items.isEmpty) {
      return ErrorStateView(
        message: state.error ?? 'Unable to load invoices.',
        onRetry: () => cubit.load(),
      );
    }
    if (state.items.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.receipt,
        title: 'No invoices',
        message: 'Verified sessions billed into invoices will appear here.',
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
          final inv = state.items[i];
          return _InvoiceCard(
            invoice: inv,
            onRecordPayment: () => _recordPayment(context, inv),
            onVoid: () => _void(context, inv),
            onResend: () => _resend(context, inv),
          );
        },
      ),
    );
  }
}

class _InvoiceScopeBar extends StatelessWidget {
  final AdminInvoicesState state;
  const _InvoiceScopeBar({required this.state});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminInvoicesCubit>();
    final scopes = <(String, String, int?)>[
      ('all', 'All', null),
      ('due', 'Due', state.due),
      ('overdue', 'Overdue', null),
      ('paid', 'Paid', state.paid),
      ('settled', 'Settled', state.settled),
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

class _InvoiceCard extends StatelessWidget {
  final InvoiceRecord invoice;
  final VoidCallback onRecordPayment;
  final VoidCallback onVoid;
  final VoidCallback onResend;

  const _InvoiceCard({
    required this.invoice,
    required this.onRecordPayment,
    required this.onVoid,
    required this.onResend,
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
                      [
                        invoice.invoiceNumber.isEmpty
                            ? 'Invoice'
                            : invoice.invoiceNumber,
                        if (invoice.periodLabel.isNotEmpty) invoice.periodLabel,
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 14.sp),
                    ),
                    Text(
                      '${invoice.studentName.isEmpty ? 'Student' : invoice.studentName}'
                      '${invoice.mentorName.isEmpty ? '' : ' · ${invoice.mentorName}'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 12.5.sp),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 10.w),
              Text(
                Formatters.rupeesPlain(invoice.amount),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15.sp,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          _statusChip(),
          if (invoice.isDue) ...[
            SizedBox(height: 12.h),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: onRecordPayment,
                    icon: Icon(LucideIcons.checkCircle2, size: 16.sp),
                    label: const Text('Record payment'),
                  ),
                ),
                SizedBox(width: 10.w),
                OutlinedButton.icon(
                  style:
                      OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                  onPressed: onVoid,
                  icon: Icon(LucideIcons.ban, size: 16.sp),
                  label: const Text('Void'),
                ),
              ],
            ),
          ] else if (invoice.isPaid) ...[
            SizedBox(height: 12.h),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onResend,
                icon: Icon(LucideIcons.mail, size: 16.sp),
                label: const Text('Resend receipt'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _statusChip() {
    late final Color color;
    late final String label;
    if (invoice.isSettled) {
      color = AppColors.success;
      label = 'Settled';
    } else if (invoice.isPaid) {
      color = AppColors.primary;
      label = 'Paid';
    } else if (invoice.isOverdue) {
      color = AppColors.danger;
      label = invoice.daysOverdue > 0
          ? '${invoice.daysOverdue}d overdue'
          : 'Overdue';
    } else if (invoice.isDue) {
      color = AppColors.warning;
      label = 'Payment due';
    } else {
      color = AppColors.textMuted;
      label = 'Void';
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

class _RecordPaymentSheet extends StatefulWidget {
  final InvoiceRecord invoice;
  const _RecordPaymentSheet({required this.invoice});

  @override
  State<_RecordPaymentSheet> createState() => _RecordPaymentSheetState();
}

class _RecordPaymentSheetState extends State<_RecordPaymentSheet> {
  String _method = _invoiceMethods.first;
  final _note = TextEditingController();

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  String _methodLabel(String m) {
    switch (m) {
      case 'cash':
        return 'Cash';
      case 'upi':
        return 'UPI';
      case 'bank-transfer':
        return 'Bank transfer';
      default:
        return 'Other';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
      ),
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
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
            Text('Record payment',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp)),
            SizedBox(height: 4.h),
            Text(
              '${widget.invoice.studentName.isEmpty ? 'Student' : widget.invoice.studentName} · ${Formatters.rupeesPlain(widget.invoice.amount)}. A receipt is emailed automatically.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
            ),
            SizedBox(height: 18.h),
            Text('Method',
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5.sp,
                    color: AppColors.textSecondary)),
            SizedBox(height: 8.h),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(16.r),
                border: Border.all(color: AppColors.border),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _method,
                  isExpanded: true,
                  borderRadius: BorderRadius.circular(16.r),
                  items: _invoiceMethods
                      .map((m) => DropdownMenuItem(
                          value: m, child: Text(_methodLabel(m))))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _method = v);
                  },
                ),
              ),
            ),
            SizedBox(height: 16.h),
            TextField(
              controller: _note,
              decoration: const InputDecoration(
                labelText: 'Note (optional)',
              ),
            ),
            SizedBox(height: 24.h),
            FilledButton(
              onPressed: () => Navigator.pop(context, {
                'method': _method,
                'note': _note.text.trim().isEmpty ? null : _note.text.trim(),
              }),
              child: const Text('Record payment'),
            ),
          ],
        ),
      ),
    );
  }
}
