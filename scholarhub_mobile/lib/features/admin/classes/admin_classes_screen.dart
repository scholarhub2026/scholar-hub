import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/catalog.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_classes_cubit.dart';
import 'class_form_screen.dart';

class AdminClassesScreen extends StatelessWidget {
  const AdminClassesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminClassesCubit()..load(),
      child: const _ClassesView(),
    );
  }
}

class _ClassesView extends StatelessWidget {
  const _ClassesView();

  void _openForm(BuildContext context, {ClassItem? existing}) {
    final cubit = context.read<AdminClassesCubit>();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: cubit,
          child: ClassFormScreen(
            existing: existing,
            subjects: cubit.state.subjects,
          ),
        ),
      ),
    );
  }

  Future<void> _delete(BuildContext context, ClassItem item) async {
    final cubit = context.read<AdminClassesCubit>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        title: const Text('Delete class?'),
        content: Text('Remove "${item.className}" from the catalog?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await cubit.delete(item.id);
      if (context.mounted) AppSnackbar.success(context, 'Class deleted.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to delete.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdminClassesCubit, AdminClassesState>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading && state.classes.isEmpty) {
          return const ShimmerList(itemHeight: 96);
        }
        if (state.status == ViewStatus.failure && state.classes.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load classes.',
            onRetry: () => context.read<AdminClassesCubit>().load(),
          );
        }
        return Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(16.w, 14.h, 16.w, 6.h),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: Size.fromHeight(50.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16.r),
                    ),
                  ),
                  onPressed: () => _openForm(context),
                  icon: const Icon(LucideIcons.plus, color: Colors.white),
                  label: const Text('New class',
                      style: TextStyle(color: Colors.white)),
                ),
              ),
            ),
            Expanded(
              child: state.classes.isEmpty
                  ? const EmptyState(
                      icon: LucideIcons.graduationCap,
                      title: 'No classes yet',
                      message: 'Create your first class to start the catalog.',
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () => context.read<AdminClassesCubit>().load(),
                      child: ListView.separated(
                        padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 32.h),
                        itemCount: state.classes.length,
                        separatorBuilder: (_, _) => SizedBox(height: 10.h),
                        itemBuilder: (context, i) {
                          final c = state.classes[i];
                          return _ClassCard(
                            item: c,
                            onEdit: () => _openForm(context, existing: c),
                            onDelete: () => _delete(context, c),
                          );
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }
}

class _ClassCard extends StatelessWidget {
  final ClassItem item;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ClassCard({
    required this.item,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            height: 46.h,
            width: 46.w,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.circular(13.r),
            ),
            child: Icon(LucideIcons.graduationCap,
                color: Colors.white, size: 22.sp),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        item.className.isEmpty ? 'Class' : item.className,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (!item.isActive) ...[
                      SizedBox(width: 6.w),
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 7.w, vertical: 2.h),
                        decoration: BoxDecoration(
                          color: AppColors.dangerSoft,
                          borderRadius: BorderRadius.circular(6.r),
                        ),
                        child: Text(
                          'Inactive',
                          style: TextStyle(
                            color: AppColors.danger,
                            fontSize: 10.5.sp,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  '${item.syllabus.isEmpty ? '—' : item.syllabus} · '
                  '${item.subjects.length} subjects · '
                  '${Formatters.rupeesPlain(num.tryParse(item.basePrice) ?? 0)}',
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
          IconButton(
            icon: Icon(LucideIcons.pencil, size: 18.sp),
            color: AppColors.primary,
            onPressed: onEdit,
          ),
          IconButton(
            icon: Icon(LucideIcons.trash2, size: 18.sp),
            color: AppColors.danger,
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}
