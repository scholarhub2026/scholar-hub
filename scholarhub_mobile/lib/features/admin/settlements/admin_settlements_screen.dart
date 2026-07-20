import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_settlements_cubit.dart';
import 'settle_sheet.dart';

class AdminSettlementsScreen extends StatelessWidget {
  const AdminSettlementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminSettlementsCubit()..load(),
      child: const _SettlementsView(),
    );
  }
}

class _SettlementsView extends StatelessWidget {
  const _SettlementsView();

  Future<void> _settle(BuildContext context, MentorPending mentor) async {
    final cubit = context.read<AdminSettlementsCubit>();
    final payload = await showSettleSheet(context, mentor: mentor);
    if (payload == null) return;
    try {
      await cubit.createSettlement(
        mentorId: mentor.mentorId,
        invoiceIds: (payload['invoiceIds'] as List).cast<String>(),
        amount: payload['amount'] as num?,
        method: payload['method'] as String,
        reference: payload['reference'] as String?,
        note: payload['note'] as String?,
      );
      if (context.mounted) AppSnackbar.success(context, 'Payout recorded.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to record payout.');
    }
  }

  Future<void> _void(BuildContext context, SettlementRecord settlement) async {
    final cubit = context.read<AdminSettlementsCubit>();
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Void payout?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('This reverses the payout. Add a reason (optional):'),
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
      await cubit.voidSettlement(settlement.id, reason.isEmpty ? null : reason);
      if (context.mounted) AppSnackbar.success(context, 'Payout voided.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to void.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminSettlementsCubit, AdminSettlementsState>(
      builder: (context, state) {
        final cubit = context.read<AdminSettlementsCubit>();
        if (state.status == ViewStatus.loading &&
            state.settlements.isEmpty &&
            state.pendingByMentor.isEmpty) {
          return const ShimmerList(itemHeight: 120);
        }
        if (state.status == ViewStatus.failure &&
            state.settlements.isEmpty &&
            state.pendingByMentor.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load settlements.',
            onRetry: () => cubit.load(),
          );
        }
        if (state.settlements.isEmpty && state.pendingByMentor.isEmpty) {
          return const EmptyState(
            icon: LucideIcons.banknote,
            title: 'Nothing to settle',
            message: 'Paid invoices ready for payout will appear here.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => cubit.load(),
          child: ListView(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 32.h),
            children: [
              _sectionHeader('Owed to mentors'),
              SizedBox(height: 10.h),
              if (state.pendingByMentor.isEmpty)
                _emptyCard('No pending payouts. 🎉')
              else
                ...state.pendingByMentor.map((m) => _PendingCard(
                      mentor: m,
                      onSettle: () => _settle(context, m),
                    )),
              SizedBox(height: 22.h),
              _sectionHeader('Payout history'),
              SizedBox(height: 10.h),
              if (state.settlements.isEmpty)
                _emptyCard('No payouts recorded yet.')
              else
                ...state.settlements.map((s) => _SettlementCard(
                      settlement: s,
                      onVoid: () => _void(context, s),
                    )),
            ],
          ),
        );
      },
    );
  }

  Widget _sectionHeader(String text) => Text(
        text,
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 16.sp,
          color: AppColors.textPrimary,
        ),
      );

  Widget _emptyCard(String message) => Container(
        padding: EdgeInsets.all(18.r),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Center(
          child:
              Text(message, style: const TextStyle(color: AppColors.textMuted)),
        ),
      );
}

class _PendingCard extends StatelessWidget {
  final MentorPending mentor;
  final VoidCallback onSettle;

  const _PendingCard({required this.mentor, required this.onSettle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Container(
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
                        mentor.mentorName.isEmpty ? 'Mentor' : mentor.mentorName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        '${mentor.invoices.length} invoice${mentor.invoices.length == 1 ? '' : 's'}',
                        style: TextStyle(
                            fontSize: 12.sp, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                Text(
                  Formatters.rupeesPlain(mentor.total),
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16.sp,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onSettle,
                icon: Icon(LucideIcons.banknote, size: 16.sp),
                label: const Text('Settle'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettlementCard extends StatelessWidget {
  final SettlementRecord settlement;
  final VoidCallback onVoid;

  const _SettlementCard({required this.settlement, required this.onVoid});

  @override
  Widget build(BuildContext context) {
    final meta = [
      if (settlement.method.isNotEmpty) settlement.method,
      if (settlement.reference.isNotEmpty) settlement.reference,
      if (settlement.paidAt != null) Formatters.date(settlement.paidAt),
    ].join(' · ');
    final voided = !settlement.isRecorded;
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
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          settlement.settlementNumber.isEmpty
                              ? 'Payout'
                              : settlement.settlementNumber,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (voided) ...[
                        SizedBox(width: 8.w),
                        Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 6.w, vertical: 1.h),
                          decoration: BoxDecoration(
                            color: AppColors.dangerSoft,
                            borderRadius: BorderRadius.circular(6.r),
                          ),
                          child: Text('Void',
                              style: TextStyle(
                                  color: AppColors.danger,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 10.sp)),
                        ),
                      ],
                    ],
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    '${settlement.mentorName}${meta.isEmpty ? '' : ' · $meta'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            SizedBox(width: 10.w),
            Text(
              Formatters.rupeesPlain(settlement.amount),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            if (!voided)
              IconButton(
                tooltip: 'Void',
                icon: Icon(LucideIcons.trash2,
                    size: 18.sp, color: AppColors.danger),
                onPressed: onVoid,
              ),
          ],
        ),
      ),
    );
  }
}
