import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/ad_banner.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'admin_ads_cubit.dart';

class AdminAdsScreen extends StatelessWidget {
  const AdminAdsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdminAdsCubit()..load(),
      child: const _AdsAdminView(),
    );
  }
}

class _AdsAdminView extends StatelessWidget {
  const _AdsAdminView();

  Future<void> _openForm(BuildContext context, {AdBanner? existing}) async {
    final cubit = context.read<AdminAdsCubit>();
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: cubit,
        child: _AdFormSheet(existing: existing),
      ),
    );
    if (saved == true && context.mounted) {
      AppSnackbar.success(
        context,
        existing == null ? 'Banner added.' : 'Banner updated.',
      );
    }
  }

  Future<void> _confirmDelete(BuildContext context, AdBanner ad) async {
    final cubit = context.read<AdminAdsCubit>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        title: const Text('Delete banner?'),
        content: Text('“${ad.title}” will be removed from the app.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await cubit.delete(ad.id);
      if (context.mounted) AppSnackbar.success(context, 'Banner deleted.');
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to delete.');
    }
  }

  Future<void> _toggle(BuildContext context, AdBanner ad) async {
    try {
      await context.read<AdminAdsCubit>().toggleActive(ad);
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
          child: SizedBox(
            width: double.infinity,
            height: 50.h,
            child: FilledButton.icon(
              onPressed: () => _openForm(context),
              icon: const Icon(LucideIcons.plus, color: Colors.white),
              label: const Text('Add banner'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.r),
                ),
              ),
            ),
          ),
        ),
        Expanded(
          child: BlocBuilder<AdminAdsCubit, AdminAdsState>(
            builder: (context, state) {
              if (state.status == ViewStatus.loading && state.items.isEmpty) {
                return const ShimmerList(itemHeight: 120);
              }
              if (state.status == ViewStatus.failure && state.items.isEmpty) {
                return ErrorStateView(
                  message: state.error ?? 'Unable to load banners.',
                  onRetry: () => context.read<AdminAdsCubit>().load(),
                );
              }
              if (state.items.isEmpty) {
                return const EmptyState(
                  icon: LucideIcons.image,
                  title: 'No banners yet',
                  message: 'Add your first promotional banner using the button above.',
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () => context.read<AdminAdsCubit>().load(),
                child: ListView.separated(
                  padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 32.h),
                  itemCount: state.items.length,
                  separatorBuilder: (_, _) => SizedBox(height: 12.h),
                  itemBuilder: (context, i) => _AdCard(
                    ad: state.items[i],
                    onEdit: () => _openForm(context, existing: state.items[i]),
                    onToggle: () => _toggle(context, state.items[i]),
                    onDelete: () => _confirmDelete(context, state.items[i]),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _AdCard extends StatelessWidget {
  final AdBanner ad;
  final VoidCallback onEdit;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  const _AdCard({
    required this.ad,
    required this.onEdit,
    required this.onToggle,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 7,
            child: CachedNetworkImage(
              imageUrl: ad.imageUrl,
              fit: BoxFit.cover,
              placeholder: (_, _) => Container(color: AppColors.surfaceAlt),
              errorWidget: (_, _, _) => Container(
                color: AppColors.surfaceAlt,
                alignment: Alignment.center,
                child: Icon(
                  Icons.image_not_supported_outlined,
                  color: AppColors.textMuted,
                  size: 26.sp,
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(14.w, 10.h, 6.w, 6.h),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ad.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14.5.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      SizedBox(height: 2.h),
                      Text(
                        'Order ${ad.order}'
                        '${ad.hasLink ? ' · has link' : ''}'
                        ' · ${ad.isActive ? 'Active' : 'Hidden'}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: ad.isActive
                              ? AppColors.success
                              : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: ad.isActive,
                  activeTrackColor: AppColors.primary,
                  onChanged: (_) => onToggle(),
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
          ),
        ],
      ),
    );
  }
}

/// Create/edit form. Owns its controllers + ValueNotifiers (no setState); the
/// image preview simply listens to the URL field's own controller.
class _AdFormSheet extends StatefulWidget {
  final AdBanner? existing;

  const _AdFormSheet({this.existing});

  @override
  State<_AdFormSheet> createState() => _AdFormSheetState();
}

class _AdFormSheetState extends State<_AdFormSheet> {
  late final TextEditingController _title;
  late final TextEditingController _image;
  late final TextEditingController _link;
  late final TextEditingController _order;
  late final ValueNotifier<bool> _active;
  final ValueNotifier<bool> _submitting = ValueNotifier(false);

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?.title ?? '');
    _image = TextEditingController(text: e?.imageUrl ?? '');
    _link = TextEditingController(text: e?.linkUrl ?? '');
    _order = TextEditingController(text: (e?.order ?? 0).toString());
    _active = ValueNotifier(e?.isActive ?? true);
  }

  @override
  void dispose() {
    _title.dispose();
    _image.dispose();
    _link.dispose();
    _order.dispose();
    _active.dispose();
    _submitting.dispose();
    super.dispose();
  }

  Future<void> _save(BuildContext context) async {
    final title = _title.text.trim();
    final image = _image.text.trim();
    if (title.isEmpty || image.isEmpty) {
      AppSnackbar.error(context, 'Title and image URL are required.');
      return;
    }
    FocusScope.of(context).unfocus();
    _submitting.value = true;
    final cubit = context.read<AdminAdsCubit>();
    final order = int.tryParse(_order.text.trim()) ?? 0;
    try {
      if (_isEdit) {
        await cubit.update(widget.existing!.id, {
          'title': title,
          'imageUrl': image,
          'linkUrl': _link.text.trim(),
          'isActive': _active.value,
          'order': order,
        });
      } else {
        await cubit.create(
          title: title,
          imageUrl: image,
          linkUrl: _link.text.trim(),
          isActive: _active.value,
          order: order,
        );
      }
      if (context.mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      _submitting.value = false;
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      _submitting.value = false;
      if (context.mounted) AppSnackbar.error(context, 'Unable to save the banner.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40.w,
                  height: 4.h,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                ),
              ),
              SizedBox(height: 18.h),
              Text(
                _isEdit ? 'Edit banner' : 'New banner',
                style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800),
              ),
              SizedBox(height: 16.h),
              // Live preview driven by the image URL controller.
              ValueListenableBuilder<TextEditingValue>(
                valueListenable: _image,
                builder: (context, value, _) {
                  final url = value.text.trim();
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(14.r),
                    child: AspectRatio(
                      aspectRatio: 16 / 7,
                      child: url.isEmpty
                          ? Container(
                              color: AppColors.surfaceAlt,
                              alignment: Alignment.center,
                              child: Text(
                                'Image preview',
                                style: TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 13.sp,
                                ),
                              ),
                            )
                          : CachedNetworkImage(
                              imageUrl: url,
                              fit: BoxFit.cover,
                              placeholder: (_, _) =>
                                  Container(color: AppColors.surfaceAlt),
                              errorWidget: (_, _, _) => Container(
                                color: AppColors.surfaceAlt,
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.broken_image_outlined,
                                  color: AppColors.textMuted,
                                  size: 26.sp,
                                ),
                              ),
                            ),
                    ),
                  );
                },
              ),
              SizedBox(height: 16.h),
              _field(_title, 'Title', LucideIcons.type),
              SizedBox(height: 12.h),
              _field(_image, 'Image URL', LucideIcons.image),
              SizedBox(height: 12.h),
              _field(_link, 'Link URL (optional)', LucideIcons.link),
              SizedBox(height: 12.h),
              _field(
                _order,
                'Order (lower shows first)',
                LucideIcons.arrowUpDown,
                keyboardType: TextInputType.number,
              ),
              SizedBox(height: 8.h),
              ValueListenableBuilder<bool>(
                valueListenable: _active,
                builder: (context, active, _) => SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Active',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14.sp,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  subtitle: Text(
                    active ? 'Shown in the app carousel' : 'Hidden from users',
                    style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
                  ),
                  value: active,
                  activeTrackColor: AppColors.primary,
                  onChanged: (v) => _active.value = v,
                ),
              ),
              SizedBox(height: 14.h),
              SizedBox(
                width: double.infinity,
                height: 52.h,
                child: ValueListenableBuilder<bool>(
                  valueListenable: _submitting,
                  builder: (context, submitting, _) => ElevatedButton(
                    onPressed: submitting ? null : () => _save(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                    ),
                    child: submitting
                        ? SizedBox(
                            height: 20.h,
                            width: 20.h,
                            child: const CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            _isEdit ? 'Save changes' : 'Add banner',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15.sp,
                            ),
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

  Widget _field(
    TextEditingController controller,
    String hint,
    IconData icon, {
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, size: 20.sp),
      ),
    );
  }
}
