import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/enquiry.dart';
import '../enquiry_draft.dart';

/// Step C of the enquiry flow: a read-only summary before "Enquire Now".
class EnquiryReviewStep extends StatelessWidget {
  final EnquiryDraft draft;

  const EnquiryReviewStep({super.key, required this.draft});

  @override
  Widget build(BuildContext context) {
    final free = draft.isDemo;
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
      children: [
        Text(
          'Review & send',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 4.h),
        Text(
          'We\'ll reach out to confirm the details — no payment or booking yet.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
        ),
        SizedBox(height: 20.h),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(22.r),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              _row('Mentor', draft.mentor.fullName),
              _divider(),
              _row('Syllabus', draft.syllabus ?? '—'),
              _divider(),
              _row('Class',
                  free ? 'Demo class' : (draft.selectedClass?.className ?? '—')),
              _divider(),
              _row('Type', draft.enquiryType?.label ?? '—'),
              if (draft.requiresSubjects) ...[
                _divider(),
                _row(
                  'Subjects',
                  draft.chosenSubjects.map((s) => s.name).join(', '),
                ),
              ],
              _divider(),
              _row('Student', draft.studentName),
              _divider(),
              _row('Email', draft.email),
              _divider(),
              _row('Phone', draft.phone),
              if (draft.message.trim().isNotEmpty) ...[
                _divider(),
                _row('Message', draft.message.trim()),
              ],
            ],
          ),
        ),
        SizedBox(height: 20.h),
        Container(
          padding: EdgeInsets.all(18.r),
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            borderRadius: BorderRadius.circular(20.r),
          ),
          child: Row(
            children: [
              Icon(free ? LucideIcons.gift : LucideIcons.wallet,
                  color: Colors.white, size: 22.sp),
              SizedBox(width: 12.w),
              Expanded(
                child: Text(
                  'Indicative fee',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 15.sp,
                  ),
                ),
              ),
              Text(
                free ? 'Free' : Formatters.rupeesPlain(draft.estimatedAmount),
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 22.sp,
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 16.h),
        Row(
          children: [
            Icon(LucideIcons.shieldCheck, size: 16.sp, color: AppColors.success),
            SizedBox(width: 8.w),
            Expanded(
              child: Text(
                'This is just an enquiry. Our team will contact you before '
                'anything is booked.',
                style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90.w,
            child: Text(
              label,
              style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
            ),
          ),
          Expanded(
            child: Text(
              value.isEmpty ? '—' : value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                fontSize: 13.5.sp,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() =>
      Divider(height: 1.h, thickness: 1, color: AppColors.border);
}
