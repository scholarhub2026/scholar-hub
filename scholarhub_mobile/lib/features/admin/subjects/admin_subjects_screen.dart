import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/catalog.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_subjects_cubit.dart';

class AdminSubjectsScreen extends StatelessWidget {
  const AdminSubjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminSubjectsCubit()..load(),
      child: const _SubjectsView(),
    );
  }
}

class _SubjectsView extends StatefulWidget {
  const _SubjectsView();

  @override
  State<_SubjectsView> createState() => _SubjectsViewState();
}

class _SubjectsViewState extends State<_SubjectsView> {
  final _controller = TextEditingController();
  bool _creating = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _create(BuildContext context) async {
    final name = _controller.text.trim();
    if (name.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() => _creating = true);
    try {
      await context.read<AdminSubjectsCubit>().create(name);
      if (!context.mounted) return;
      _controller.clear();
      AppSnackbar.success(context, 'Subject added.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to add subject.');
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  Future<void> _rename(BuildContext context, SubjectCatalogItem item) async {
    final cubit = context.read<AdminSubjectsCubit>();
    final controller = TextEditingController(text: item.name);
    final String? name;
    try {
      name = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
          title: const Text('Rename subject'),
          content: TextField(
            controller: controller,
            autofocus: true,
            decoration: const InputDecoration(hintText: 'Subject name'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: const Text('Save'),
            ),
          ],
        ),
      );
    } finally {
      controller.dispose();
    }
    if (name == null || name.isEmpty || name == item.name) return;
    try {
      await cubit.update(item.id, name, item.isActive);
      if (context.mounted) AppSnackbar.success(context, 'Subject updated.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  Future<void> _toggle(
      BuildContext context, SubjectCatalogItem item, bool active) async {
    try {
      await context.read<AdminSubjectsCubit>().update(item.id, item.name, active);
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(16.w, 14.h, 16.w, 8.h),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _create(context),
                  decoration: InputDecoration(
                    hintText: 'New subject name',
                    prefixIcon: Icon(LucideIcons.bookOpen, size: 20.sp),
                  ),
                ),
              ),
              SizedBox(width: 10.w),
              SizedBox(
                height: 52.h,
                child: FilledButton(
                  onPressed: _creating ? null : () => _create(context),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16.r),
                    ),
                  ),
                  child: _creating
                      ? SizedBox(
                          height: 20.h,
                          width: 20.w,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2.2,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        )
                      : const Icon(LucideIcons.plus, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: BlocBuilder<AdminSubjectsCubit, AdminSubjectsState>(
            builder: (context, state) {
              if (state.status == ViewStatus.loading && state.items.isEmpty) {
                return const ShimmerList(itemHeight: 64);
              }
              if (state.status == ViewStatus.failure && state.items.isEmpty) {
                return ErrorStateView(
                  message: state.error ?? 'Unable to load subjects.',
                  onRetry: () => context.read<AdminSubjectsCubit>().load(),
                );
              }
              if (state.items.isEmpty) {
                return const EmptyState(
                  icon: LucideIcons.bookOpen,
                  title: 'No subjects yet',
                  message: 'Add your first subject using the field above.',
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () => context.read<AdminSubjectsCubit>().load(),
                child: ListView.separated(
                  padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 32.h),
                  itemCount: state.items.length,
                  separatorBuilder: (_, _) => SizedBox(height: 10.h),
                  itemBuilder: (context, i) {
                    final item = state.items[i];
                    return Container(
                      padding: EdgeInsets.fromLTRB(16.w, 6.h, 8.w, 6.h),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              _titleCase(item.name),
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14.5.sp,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          Switch(
                            value: item.isActive,
                            activeTrackColor: AppColors.primary,
                            onChanged: (v) => _toggle(context, item, v),
                          ),
                          IconButton(
                            icon: Icon(LucideIcons.pencil, size: 18.sp),
                            color: AppColors.primary,
                            onPressed: () => _rename(context, item),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  String _titleCase(String s) => s
      .split(' ')
      .where((w) => w.isNotEmpty)
      .map((w) => w[0].toUpperCase() + w.substring(1))
      .join(' ');
}
