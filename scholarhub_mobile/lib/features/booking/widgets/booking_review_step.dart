import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking_draft.dart';

class BookingReviewStep extends StatelessWidget {
  final BookingDraft draft;

  const BookingReviewStep({super.key, required this.draft});

  @override
  Widget build(BuildContext context) {
    final cls = draft.selectedClass;
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
      children: [
        Text(
          'Review & confirm',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 4.h),
        Text(
          'Check your summary — your request goes to our team for approval.',
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
              _row('Class', cls?.className ?? '—'),
              _divider(),
              _row('Booking Type', draft.bookingType?.label ?? '—'),
              if (draft.requiresSubjects) ...[
                _divider(),
                _subjectsRow(),
              ],
              _divider(),
              _scheduleRow(),
              _divider(),
              _row('Payment', '${Formatters.rupeesPlain(draft.totalAmount)} / ${draft.paymentFrequency.perLabel}'),
              if (draft.scheduleCadence == ScheduleCadence.recurring &&
                  draft.classStartDate != null) ...[
                _divider(),
                _row('Classes start', Formatters.date(draft.classStartDate)),
              ],
              _divider(),
              _row('Student', draft.studentName),
              _divider(),
              _row('Email', draft.email),
              _divider(),
              _row('Phone', draft.phone),
            ],
          ),
        ),
        SizedBox(height: 18.h),
        Container(
          padding: EdgeInsets.all(18.r),
          decoration: BoxDecoration(
            gradient: AppColors.brandGradient,
            borderRadius: BorderRadius.circular(20.r),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.wallet, color: Colors.white),
              SizedBox(width: 12.w),
              Expanded(
                child: Text(
                  'Fee',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 15.sp,
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Text(
                '${Formatters.rupeesPlain(draft.totalAmount)}/${draft.paymentFrequency.perLabel}',
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
            Icon(LucideIcons.shieldCheck,
                size: 16.sp, color: AppColors.success),
            SizedBox(width: 8.w),
            Expanded(
              child: Text(
                'No payment now. ${Formatters.rupeesPlain(draft.totalAmount)} is '
                'collected every ${draft.paymentFrequency.perLabel} after your '
                'classes, once our team approves the booking.',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: AppColors.textMuted,
                ),
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
            width: 110.w,
            child: Text(
              label,
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 13.sp,
              ),
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

  Widget _subjectsRow() {
    final subjects = draft.chosenSubjects.map((s) => s.name).join(', ');
    return _row('Subjects', subjects.isEmpty ? '—' : subjects);
  }

  Widget _scheduleRow() {
    if (draft.selectedSlots.isEmpty) return _row('Schedule', '—');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    final lines = draft.selectedSlots.map((s) {
      final day = (s.dayOfWeek >= 0 && s.dayOfWeek < 7) ? days[s.dayOfWeek] : '';
      final time = '${s.startTime}–${s.endTime}';
      if (s.cadence == ScheduleCadence.single && s.date != null) {
        final d = s.date!;
        return '$day ${d.day}/${d.month} · $time';
      }
      return 'Every $day · $time';
    }).join('\n');
    final label = draft.scheduleCadence == ScheduleCadence.single
        ? 'Session(s)'
        : 'Weekly slots';
    return _row(label, lines);
  }

  Widget _divider() =>
      Divider(height: 1.h, thickness: 1, color: AppColors.border);
}
