import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../state/auth/auth_cubit.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'mentor_sessions_cubit.dart';
import 'session_log_sheet.dart';

class MentorSessionsScreen extends StatelessWidget {
  const MentorSessionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final mentorId = context.read<AuthCubit>().state.user?.id ?? '';
    return BlocProvider(
      create: (_) => MentorSessionsCubit(mentorId)..load(),
      child: const _SessionsView(),
    );
  }
}

const _filters = <(String, String)>[
  ('all', 'All'),
  ('logged', 'Pending'),
  ('verified', 'Verified'),
  ('rejected', 'Rejected'),
];

class _SessionsView extends StatelessWidget {
  const _SessionsView();

  Future<void> _log(BuildContext context) async {
    final cubit = context.read<MentorSessionsCubit>();
    final payload = await showLogSessionSheet(
      context,
      bookings: cubit.state.confirmedBookings,
    );
    if (payload == null) return;
    try {
      await cubit.logSession(
        bookingId: payload['bookingId'] as String,
        date: payload['date'] as String,
        startTime: payload['startTime'] as String,
        endTime: payload['endTime'] as String,
        subjectId: payload['subjectId'] as String?,
        notes: payload['notes'] as String?,
      );
      if (context.mounted) AppSnackbar.success(context, 'Session logged.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to log session.');
    }
  }

  Future<void> _edit(BuildContext context, SessionRecord session) async {
    final cubit = context.read<MentorSessionsCubit>();
    final payload = await showEditSessionSheet(context, session: session);
    if (payload == null) return;
    try {
      await cubit.updateSession(
        session.id,
        date: payload['date'] as String?,
        startTime: payload['startTime'] as String?,
        endTime: payload['endTime'] as String?,
        notes: payload['notes'] as String?,
      );
      if (context.mounted) AppSnackbar.success(context, 'Session updated.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  Future<void> _delete(BuildContext context, SessionRecord session) async {
    final cubit = context.read<MentorSessionsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete session?'),
        content: const Text('This logged session will be removed.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.deleteSession(session.id);
      if (context.mounted) AppSnackbar.success(context, 'Session deleted.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to delete.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MentorSessionsCubit, MentorSessionsState>(
      builder: (context, state) {
        return Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 4.h),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => _log(context),
                  icon: Icon(LucideIcons.plus, size: 18.sp),
                  label: const Text('Log session'),
                ),
              ),
            ),
            _FilterBar(state: state),
            Expanded(child: _list(context, state)),
          ],
        );
      },
    );
  }

  Widget _list(BuildContext context, MentorSessionsState state) {
    final cubit = context.read<MentorSessionsCubit>();
    if (state.status == ViewStatus.loading && state.sessions.isEmpty) {
      return const ShimmerList(itemHeight: 120);
    }
    if (state.status == ViewStatus.failure && state.sessions.isEmpty) {
      return ErrorStateView(
        message: state.error ?? 'Unable to load sessions.',
        onRetry: () => cubit.load(),
      );
    }
    if (state.sessions.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.clipboardList,
        title: 'No sessions',
        message: 'Log your completed classes to bill them.',
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => cubit.load(),
      child: ListView.separated(
        padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 120.h),
        itemCount: state.sessions.length,
        separatorBuilder: (_, _) => SizedBox(height: 12.h),
        itemBuilder: (_, i) => _SessionCard(
          session: state.sessions[i],
          onEdit: () => _edit(context, state.sessions[i]),
          onDelete: () => _delete(context, state.sessions[i]),
        ),
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final MentorSessionsState state;
  const _FilterBar({required this.state});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<MentorSessionsCubit>();
    return SizedBox(
      height: 52.h,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        itemCount: _filters.length,
        separatorBuilder: (_, _) => SizedBox(width: 8.w),
        itemBuilder: (_, i) {
          final (key, label) = _filters[i];
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
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _SessionCard({
    required this.session,
    required this.onEdit,
    required this.onDelete,
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
                      '${Formatters.date(session.date)} · ${session.startTime}–${session.endTime}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14.sp,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      [
                        if (session.studentName.isNotEmpty) session.studentName,
                        if (session.subjectName.isNotEmpty) session.subjectName,
                        session.durationLabel,
                      ].join(' · '),
                      style: TextStyle(
                          fontSize: 12.sp, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              _statusChip(session.status),
            ],
          ),
          if (session.isBilled || session.notes.isNotEmpty) ...[
            SizedBox(height: 10.h),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (session.isBilled)
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                    decoration: BoxDecoration(
                      color: AppColors.successSoft,
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                    child: Text(
                      'Billed',
                      style: TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                        fontSize: 10.5.sp,
                      ),
                    ),
                  ),
                if (session.notes.isNotEmpty)
                  SizedBox(
                    width: double.infinity,
                    child: Text(
                      session.notes,
                      style: TextStyle(
                          fontSize: 12.sp, color: AppColors.textSecondary),
                    ),
                  ),
              ],
            ),
          ],
          if (session.isRejected && session.rejectReason.isNotEmpty) ...[
            SizedBox(height: 8.h),
            Text(
              'Rejected: ${session.rejectReason}',
              style: TextStyle(fontSize: 12.sp, color: AppColors.danger),
            ),
          ],
          if (session.isLogged) ...[
            SizedBox(height: 12.h),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onEdit,
                    icon: Icon(LucideIcons.pencil, size: 15.sp),
                    label: const Text('Edit'),
                  ),
                ),
                SizedBox(width: 10.w),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger),
                    onPressed: onDelete,
                    icon: Icon(LucideIcons.trash2, size: 15.sp),
                    label: const Text('Delete'),
                  ),
                ),
              ],
            ),
          ],
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
