import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../state/view_status.dart';
import '../../../widgets/state_views.dart';
import 'mentor_earnings_cubit.dart';

class MentorEarningsScreen extends StatelessWidget {
  const MentorEarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => MentorEarningsCubit()..load(),
      child: const _EarningsView(),
    );
  }
}

class _EarningsView extends StatelessWidget {
  const _EarningsView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MentorEarningsCubit, MentorEarningsState>(
      builder: (context, state) {
        final cubit = context.read<MentorEarningsCubit>();
        if (state.status == ViewStatus.loading &&
            state.invoices.isEmpty &&
            state.payouts.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }
        if (state.status == ViewStatus.failure &&
            state.invoices.isEmpty &&
            state.payouts.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load earnings.',
            onRetry: () => cubit.load(),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => cubit.load(),
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
                      'Paid out to you',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 13.5.sp,
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Text(
                      Formatters.rupeesPlain(state.paidOut),
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
                      icon: LucideIcons.receipt,
                      label: 'Billed',
                      value: Formatters.rupeesPlain(state.billed),
                      color: AppColors.primary,
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: _MiniStat(
                      icon: LucideIcons.wallet,
                      label: 'Collected',
                      value: Formatters.rupeesPlain(state.collected),
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 24.h),
              Text(
                'Invoices',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 12.h),
              if (state.invoices.isEmpty)
                _emptyCard('No invoices yet.')
              else
                ...state.invoices.map((i) => _InvoiceTile(invoice: i)),
              SizedBox(height: 24.h),
              Text(
                'Payouts received',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 12.h),
              if (state.payouts.isEmpty)
                _emptyCard('No payouts received yet.')
              else
                ...state.payouts.map((s) => _PayoutTile(settlement: s)),
            ],
          ),
        );
      },
    );
  }

  Widget _emptyCard(String message) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
      ),
      child: Center(
        child: Text(message, style: const TextStyle(color: AppColors.textMuted)),
      ),
    );
  }
}

class _InvoiceTile extends StatelessWidget {
  final InvoiceRecord invoice;
  const _InvoiceTile({required this.invoice});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Container(
        padding: EdgeInsets.all(14.r),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    invoice.invoiceNumber.isEmpty
                        ? 'Invoice'
                        : invoice.invoiceNumber,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    [
                      if (invoice.studentName.isNotEmpty) invoice.studentName,
                      if (invoice.periodLabel.isNotEmpty) invoice.periodLabel,
                    ].join(' · '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            SizedBox(width: 10.w),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  Formatters.rupeesPlain(invoice.amount),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 4.h),
                _InvoiceStatusChip(invoice: invoice),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InvoiceStatusChip extends StatelessWidget {
  final InvoiceRecord invoice;
  const _InvoiceStatusChip({required this.invoice});

  @override
  Widget build(BuildContext context) {
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
      label = 'Overdue';
    } else if (invoice.isDue) {
      color = AppColors.warning;
      label = 'Payment due';
    } else {
      color = AppColors.textMuted;
      label = 'Void';
    }
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 10.5.sp,
        ),
      ),
    );
  }
}

class _PayoutTile extends StatelessWidget {
  final SettlementRecord settlement;
  const _PayoutTile({required this.settlement});

  @override
  Widget build(BuildContext context) {
    final meta = [
      if (settlement.method.isNotEmpty) settlement.method,
      if (settlement.reference.isNotEmpty) settlement.reference,
    ].join(' · ');
    return Padding(
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
              child: Icon(LucideIcons.arrowDownLeft,
                  color: AppColors.success, size: 18.sp),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    settlement.settlementNumber.isEmpty
                        ? 'Payout'
                        : settlement.settlementNumber,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    [
                      if (meta.isNotEmpty) meta,
                      if (settlement.paidAt != null)
                        Formatters.date(settlement.paidAt),
                    ].join(' · '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            Text(
              Formatters.rupeesPlain(settlement.amount),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: AppColors.success,
              ),
            ),
          ],
        ),
      ),
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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
