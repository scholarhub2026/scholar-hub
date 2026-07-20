import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../data/models/booking_draft.dart';
import '../../../data/services/booking_service.dart';

class BookingReviewStep extends StatefulWidget {
  final BookingDraft draft;

  const BookingReviewStep({super.key, required this.draft});

  @override
  State<BookingReviewStep> createState() => _BookingReviewStepState();
}

class _BookingReviewStepState extends State<BookingReviewStep> {
  final BookingService _service = BookingService();
  late Future<BookingQuote> _quote;

  BookingDraft get draft => widget.draft;

  @override
  void initState() {
    super.initState();
    _quote = _fetchQuote();
  }

  Future<BookingQuote> _fetchQuote() {
    return _service.quote(
      mentorId: draft.mentor.id,
      classId: draft.selectedClass!.id,
      bookingType: draft.bookingType!.apiValue,
      selectedSubjects: draft.chosenSubjects.map((s) => s.id).toList(),
    );
  }

  void _retry() => setState(() => _quote = _fetchQuote());

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
              _row('Billing', draft.paymentFrequency.label),
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
        SizedBox(height: 20.h),
        Text(
          'Fee estimate',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 15.5.sp,
            color: AppColors.textPrimary,
          ),
        ),
        SizedBox(height: 10.h),
        FutureBuilder<BookingQuote>(
          future: _quote,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return _quoteLoading();
            }
            if (snap.hasError) {
              final err = snap.error;
              final message = err is ApiException
                  ? err.message
                  : 'Unable to price this booking right now.';
              return _quoteError(message);
            }
            return _quoteContent(snap.data!);
          },
        ),
        SizedBox(height: 16.h),
        Row(
          children: [
            Icon(LucideIcons.shieldCheck, size: 16.sp, color: AppColors.success),
            SizedBox(width: 8.w),
            Expanded(
              child: Text(
                'No payment now. Fees are collected after your classes, once our '
                'team approves the booking.',
                style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _quoteLoading() {
    return Container(
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: AppColors.border),
      ),
      child: const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );
  }

  Widget _quoteError(String message) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.dangerSoft,
        borderRadius: BorderRadius.circular(18.r),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.alertCircle, size: 18.sp, color: AppColors.danger),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              message,
              style: TextStyle(fontSize: 12.5.sp, color: AppColors.danger),
            ),
          ),
          TextButton(onPressed: _retry, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _quoteContent(BookingQuote quote) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Estimated fee',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                      ),
                    ),
                    if (quote.estimateUnit.isNotEmpty)
                      Text(
                        quote.estimateUnit,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontSize: 11.5.sp,
                        ),
                      ),
                  ],
                ),
              ),
              SizedBox(width: 12.w),
              Text(
                Formatters.rupeesPlain(quote.estimatedAmount),
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 22.sp,
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 12.h),
        Container(
          padding: EdgeInsets.all(16.r),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(18.r),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (quote.perClassFee != null)
                _rateLine('Full class',
                    '${Formatters.rupeesPlain(quote.perClassFee)} per class')
              else if (quote.subjectRates.isNotEmpty)
                ...quote.subjectRates.map((r) => _rateLine(
                    r.name.isEmpty ? 'Subject' : r.name,
                    '${Formatters.rupeesPlain(r.hourlyRate)}/hr'))
              else
                Text(
                  'The rate will be confirmed by our team.',
                  style:
                      TextStyle(color: AppColors.textMuted, fontSize: 12.5.sp),
                ),
              if (quote.billingNote.isNotEmpty) ...[
                SizedBox(height: 10.h),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(LucideIcons.info,
                        size: 14.sp, color: AppColors.textMuted),
                    SizedBox(width: 6.w),
                    Expanded(
                      child: Text(
                        quote.billingNote,
                        style: TextStyle(
                          fontSize: 11.5.sp,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _rateLine(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 6.h),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13.sp,
              fontWeight: FontWeight.w700,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
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
