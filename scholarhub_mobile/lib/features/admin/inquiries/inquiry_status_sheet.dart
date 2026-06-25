import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/inquiry.dart';

/// Bottom sheet to pick a new status for an enquiry. Returns the chosen status
/// string (a value from [kInquiryStatuses]) or null if dismissed.
Future<String?> showInquiryStatusSheet(
  BuildContext context, {
  required String current,
}) {
  return showModalBottomSheet<String>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (_) => _StatusSheet(current: current),
  );
}

Color statusColor(String status) {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return AppColors.success;
    case 'IN_PROGRESS':
      return AppColors.primary;
    case 'CANCELLED':
      return AppColors.danger;
    default:
      return AppColors.warning;
  }
}

String statusLabel(String status) {
  switch (status.toUpperCase()) {
    case 'IN_PROGRESS':
      return 'In progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

class _StatusSheet extends StatelessWidget {
  final String current;
  const _StatusSheet({required this.current});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
      ),
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 5.h,
            width: 44.w,
            margin: EdgeInsets.only(bottom: 18.h),
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(3.r),
            ),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Update enquiry status',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp),
            ),
          ),
          SizedBox(height: 14.h),
          for (final s in kInquiryStatuses)
            Padding(
              padding: EdgeInsets.only(bottom: 8.h),
              child: Material(
                color: s.toUpperCase() == current.toUpperCase()
                    ? statusColor(s).withValues(alpha: 0.12)
                    : AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(14.r),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14.r),
                  onTap: () => Navigator.pop(context, s),
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                        horizontal: 16.w, vertical: 14.h),
                    child: Row(
                      children: [
                        Container(
                          height: 10.h,
                          width: 10.w,
                          decoration: BoxDecoration(
                            color: statusColor(s),
                            shape: BoxShape.circle,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Text(
                          statusLabel(s),
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14.5.sp,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        if (s.toUpperCase() == current.toUpperCase())
                          Icon(LucideIcons.check,
                              size: 18.sp, color: statusColor(s)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
