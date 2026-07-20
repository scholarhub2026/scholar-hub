import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../state/view_status.dart';
import '../../../widgets/state_views.dart';
import 'student_invoices_cubit.dart';

class StudentInvoicesScreen extends StatelessWidget {
  const StudentInvoicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => StudentInvoicesCubit()..load(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('My Fees')),
        body: const _InvoicesView(),
      ),
    );
  }
}

class _InvoicesView extends StatelessWidget {
  const _InvoicesView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StudentInvoicesCubit, StudentInvoicesState>(
      builder: (context, state) {
        final cubit = context.read<StudentInvoicesCubit>();
        if (state.status == ViewStatus.loading && state.invoices.isEmpty) {
          return const ShimmerList(itemHeight: 110);
        }
        if (state.status == ViewStatus.failure && state.invoices.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load your invoices.',
            onRetry: () => cubit.load(),
          );
        }
        if (state.invoices.isEmpty) {
          return const EmptyState(
            icon: LucideIcons.receipt,
            title: 'No fees yet',
            message: 'Invoices for your classes will show up here.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => cubit.load(),
          child: ListView.separated(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 32.h),
            itemCount: state.invoices.length,
            separatorBuilder: (_, _) => SizedBox(height: 12.h),
            itemBuilder: (_, i) => _InvoiceCard(invoice: state.invoices[i]),
          ),
        );
      },
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  final InvoiceRecord invoice;
  const _InvoiceCard({required this.invoice});

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
                      invoice.invoiceNumber.isEmpty
                          ? 'Invoice'
                          : invoice.invoiceNumber,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15.sp),
                    ),
                    if (invoice.periodLabel.isNotEmpty)
                      Text(
                        invoice.periodLabel,
                        style: TextStyle(
                            fontSize: 12.5.sp, color: AppColors.textMuted),
                      ),
                  ],
                ),
              ),
              SizedBox(width: 10.w),
              Text(
                Formatters.rupeesPlain(invoice.amount),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16.sp,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          Row(
            children: [
              _statusChip(),
              if (invoice.isPaid || invoice.isSettled) ...[
                SizedBox(width: 8.w),
                Icon(LucideIcons.mailCheck,
                    size: 13.sp, color: AppColors.success),
                SizedBox(width: 4.w),
                Text(
                  'Receipt emailed',
                  style: TextStyle(fontSize: 11.5.sp, color: AppColors.success),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusChip() {
    late final Color color;
    late final String label;
    if (invoice.isSettled) {
      color = AppColors.success;
      label = 'Paid';
    } else if (invoice.isPaid) {
      color = AppColors.success;
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
