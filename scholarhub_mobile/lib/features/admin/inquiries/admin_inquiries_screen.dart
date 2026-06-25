import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/inquiry.dart';
import '../../../state/paged_state.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/state_views.dart';
import 'inquiries_cubit.dart';
import 'inquiry_status_sheet.dart';

class AdminInquiriesScreen extends StatelessWidget {
  const AdminInquiriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => InquiriesCubit()..load(),
      child: const _InquiriesView(),
    );
  }
}

class _InquiriesView extends StatelessWidget {
  const _InquiriesView();

  Future<void> _edit(BuildContext context, Inquiry inquiry) async {
    final cubit = context.read<InquiriesCubit>();
    final status =
        await showInquiryStatusSheet(context, current: inquiry.status);
    if (status == null || status == inquiry.status) return;
    try {
      await cubit.updateStatus(inquiry.id, status);
      if (context.mounted) {
        AppSnackbar.success(context, 'Enquiry updated.');
      }
    } on ApiException catch (e) {
      if (context.mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (context.mounted) AppSnackbar.error(context, 'Unable to update.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<InquiriesCubit, PagedState<Inquiry>>(
      builder: (context, state) {
        if (state.status == ViewStatus.loading && state.items.isEmpty) {
          return const ShimmerList(itemHeight: 130);
        }
        if (state.status == ViewStatus.failure && state.items.isEmpty) {
          return ErrorStateView(
            message: state.error ?? 'Unable to load enquiries.',
            onRetry: () => context.read<InquiriesCubit>().load(),
          );
        }
        if (state.items.isEmpty) {
          return const EmptyState(
            icon: LucideIcons.inbox,
            title: 'No enquiries yet',
            message: 'Enquiries submitted from the app will appear here.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => context.read<InquiriesCubit>().load(),
          child: ListView.separated(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 32.h),
            itemCount: state.items.length + (state.hasMore ? 1 : 0),
            separatorBuilder: (_, _) => SizedBox(height: 12.h),
            itemBuilder: (context, i) {
              if (i >= state.items.length) {
                return _LoadMoreButton(
                  loading: state.loadingMore,
                  onTap: () => context.read<InquiriesCubit>().loadMore(),
                );
              }
              final item = state.items[i];
              return _InquiryCard(
                inquiry: item,
                onEdit: () => _edit(context, item),
              );
            },
          ),
        );
      },
    );
  }
}

class _InquiryCard extends StatelessWidget {
  final Inquiry inquiry;
  final VoidCallback onEdit;

  const _InquiryCard({required this.inquiry, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(20.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(20.r),
        onTap: onEdit,
        child: Padding(
          padding: EdgeInsets.all(16.r),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 42.h,
                    width: 42.w,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradient,
                      borderRadius: BorderRadius.circular(13.r),
                    ),
                    child: Text(
                      inquiry.name.isNotEmpty
                          ? inquiry.name[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          inquiry.name.isEmpty ? 'Unknown' : inquiry.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15.sp,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (inquiry.subject.isNotEmpty)
                          Text(
                            inquiry.subject,
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
                  _StatusChip(status: inquiry.status),
                ],
              ),
              SizedBox(height: 12.h),
              _row(LucideIcons.phone, inquiry.phoneNumber),
              if (inquiry.email.isNotEmpty) _row(LucideIcons.mail, inquiry.email),
              if (inquiry.place.isNotEmpty)
                _row(LucideIcons.mapPin, inquiry.place),
              if (inquiry.message.isNotEmpty) ...[
                SizedBox(height: 8.h),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(10.r),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceMuted,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    inquiry.message,
                    style: TextStyle(
                      fontSize: 12.5.sp,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(IconData icon, String text) {
    if (text.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: EdgeInsets.only(top: 4.h),
      child: Row(
        children: [
          Icon(icon, size: 14.sp, color: AppColors.textMuted),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12.5.sp,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        statusLabel(status),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11.5.sp,
        ),
      ),
    );
  }
}

class _LoadMoreButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  const _LoadMoreButton({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 8.h),
        child: loading
            ? SizedBox(
                height: 26.h,
                width: 26.w,
                child: const CircularProgressIndicator(
                  strokeWidth: 2.4,
                  valueColor: AlwaysStoppedAnimation(AppColors.primary),
                ),
              )
            : OutlinedButton.icon(
                onPressed: onTap,
                icon: Icon(LucideIcons.chevronDown, size: 18.sp),
                label: const Text('Load more'),
              ),
      ),
    );
  }
}

/// Reusable formatted "submitted" line, exported for the dashboard preview.
String inquiryDateLabel(Inquiry inquiry) => Formatters.date(inquiry.createdAt);
