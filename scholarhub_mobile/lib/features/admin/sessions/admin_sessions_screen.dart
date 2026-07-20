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
import 'admin_sessions_cubit.dart';

class AdminSessionsScreen extends StatelessWidget {
  const AdminSessionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminSessionsCubit()..load(),
      child: const _SessionsView(),
    );
  }
}

const _scopes = <(String, String)>[
  ('logged', 'Pending'),
  ('verified', 'Verified'),
  ('rejected', 'Rejected'),
  ('all', 'All'),
];

class _SessionsView extends StatelessWidget {
  const _SessionsView();

  Future<void> _verify(BuildContext context, SessionRecord session) async {
    final cubit = context.read<AdminSessionsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Verify session?'),
        content: const Text(
          'Verifying confirms the session. Per-session bookings are invoiced '
          'immediately.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Verify')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.verify(session.id);
      if (context.mounted) AppSnackbar.success(context, 'Session verified.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to verify.');
    }
  }

  Future<void> _reject(BuildContext context, SessionRecord session) async {
    final cubit = context.read<AdminSessionsCubit>();
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reject session?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add a reason (optional):'),
            SizedBox(height: 12.h),
            TextField(
              controller: controller,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'e.g. Duration does not match the booking',
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
      await cubit.reject(session.id, reason.isEmpty ? null : reason);
      if (context.mounted) AppSnackbar.success(context, 'Session rejected.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to reject.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminSessionsCubit, AdminSessionsState>(
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

  Widget _list(BuildContext context, AdminSessionsState state) {
    final cubit = context.read<AdminSessionsCubit>();
    if (state.status == ViewStatus.loading && state.sessions.isEmpty) {
      return const ShimmerList(itemHeight: 140);
    }
    if (state.status == ViewStatus.failure && state.sessions.isEmpty) {
      return ErrorStateView(
        message: state.error ?? 'Unable to load sessions.',
        onRetry: () => cubit.load(),
      );
    }
    if (state.sessions.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.clipboardCheck,
        title: 'Nothing here',
        message: 'Sessions in this view will appear here.',
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => cubit.load(),
      child: ListView.separated(
        padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 32.h),
        itemCount: state.sessions.length,
        separatorBuilder: (_, _) => SizedBox(height: 12.h),
        itemBuilder: (_, i) => _SessionCard(
          session: state.sessions[i],
          onVerify: () => _verify(context, state.sessions[i]),
          onReject: () => _reject(context, state.sessions[i]),
        ),
      ),
    );
  }
}

class _ScopeBar extends StatelessWidget {
  final AdminSessionsState state;
  const _ScopeBar({required this.state});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<AdminSessionsCubit>();
    return SizedBox(
      height: 56.h,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
        itemCount: _scopes.length,
        separatorBuilder: (_, _) => SizedBox(width: 8.w),
        itemBuilder: (_, i) {
          final (key, label) = _scopes[i];
          final selected = state.filter == key;
          final count = key == 'logged' ? state.loggedCount : null;
          return GestureDetector(
            onTap: () => cubit.load(filter: key),
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

class _SessionCard extends StatelessWidget {
  final SessionRecord session;
  final VoidCallback onVerify;
  final VoidCallback onReject;

  const _SessionCard({
    required this.session,
    required this.onVerify,
    required this.onReject,
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
                child: Text(
                  '${Formatters.date(session.date)} · ${session.startTime}–${session.endTime}',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              _statusChip(session.status),
            ],
          ),
          SizedBox(height: 8.h),
          _metaRow(LucideIcons.user,
              'Student: ${session.studentName.isEmpty ? '—' : session.studentName}'),
          _metaRow(LucideIcons.graduationCap,
              'Mentor: ${session.mentorName.isEmpty ? '—' : session.mentorName}'),
          if (session.className.isNotEmpty || session.subjectName.isNotEmpty)
            _metaRow(
              LucideIcons.bookOpen,
              [session.className, session.subjectName]
                  .where((e) => e.isNotEmpty)
                  .join(' · '),
            ),
          _metaRow(LucideIcons.clock, session.durationLabel),
          if (session.notes.isNotEmpty) ...[
            SizedBox(height: 8.h),
            Container(
              padding: EdgeInsets.all(12.r),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Text(
                session.notes,
                style: TextStyle(
                    fontSize: 12.5.sp, color: AppColors.textSecondary),
              ),
            ),
          ],
          if (session.isRejected && session.rejectReason.isNotEmpty) ...[
            SizedBox(height: 8.h),
            Text(
              'Reason: ${session.rejectReason}',
              style: TextStyle(fontSize: 12.sp, color: AppColors.danger),
            ),
          ],
          if (session.isLogged) ...[
            SizedBox(height: 12.h),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: onVerify,
                    icon: Icon(LucideIcons.checkCircle2, size: 16.sp),
                    label: const Text('Verify'),
                  ),
                ),
                SizedBox(width: 10.w),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger),
                    onPressed: onReject,
                    icon: Icon(LucideIcons.x, size: 16.sp),
                    label: const Text('Reject'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _metaRow(IconData icon, String text) {
    return Padding(
      padding: EdgeInsets.only(top: 4.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 13.sp, color: AppColors.textMuted),
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

  Widget _statusChip(String status) {
    late final Color color;
    late final String label;
    switch (status) {
      case 'verified':
        color = AppColors.success;
        label = 'Verified';
        break;
      case 'rejected':
        color = AppColors.danger;
        label = 'Rejected';
        break;
      default:
        color = AppColors.warning;
        label = 'Pending';
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
