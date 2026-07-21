import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/primary_button.dart';

const _paymentStatuses = ['pending', 'completed', 'failed'];
const _bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const _frequencies = ['daily', 'weekly', 'monthly'];

/// "YYYY-MM-DD" from the picked local calendar day (no timezone shift).
String _ymd(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}';
}

/// Edit a booking's payment/booking status, amount and remarks. Returns the
/// update payload (or null if dismissed).
Future<Map<String, dynamic>?> showEditBookingSheet(
  BuildContext context, {
  required Booking booking,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: _EditBookingSheet(booking: booking),
    ),
  );
}

class _EditBookingSheet extends StatefulWidget {
  final Booking booking;
  const _EditBookingSheet({required this.booking});

  @override
  State<_EditBookingSheet> createState() => _EditBookingSheetState();
}

class _EditBookingSheetState extends State<_EditBookingSheet> {
  late String _paymentStatus;
  late String _bookingStatus;
  late String _frequency;
  late final TextEditingController _amount;
  late final TextEditingController _remarks;
  DateTime? _classStartDate;

  @override
  void initState() {
    super.initState();
    _paymentStatus = _paymentStatuses.contains(widget.booking.paymentStatus)
        ? widget.booking.paymentStatus
        : 'pending';
    _bookingStatus = _bookingStatuses.contains(widget.booking.bookingStatus)
        ? widget.booking.bookingStatus
        : 'pending';
    _frequency = _frequencies.contains(widget.booking.paymentFrequency)
        ? widget.booking.paymentFrequency
        : 'monthly';
    _amount = TextEditingController(
        text: widget.booking.totalAmount.toStringAsFixed(0));
    _remarks = TextEditingController(text: widget.booking.remarks);
    _classStartDate = widget.booking.classStartDate;
  }

  Future<void> _pickStartDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _classStartDate ?? now,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => _classStartDate = picked);
  }

  @override
  void dispose() {
    _amount.dispose();
    _remarks.dispose();
    super.dispose();
  }

  void _save() {
    Navigator.pop(context, {
      'paymentStatus': _paymentStatus,
      'bookingStatus': _bookingStatus,
      'paymentFrequency': _frequency,
      'totalAmount': num.tryParse(_amount.text.trim()) ?? 0,
      'remarks': _remarks.text.trim(),
      if (_classStartDate != null) 'classStartDate': _ymd(_classStartDate!),
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
      ),
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                height: 5.h,
                width: 44.w,
                margin: EdgeInsets.only(bottom: 16.h),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(3.r),
                ),
              ),
            ),
            Text(
              'Update booking',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp),
            ),
            SizedBox(height: 4.h),
            Text(
              widget.booking.studentName.isEmpty
                  ? 'Booking'
                  : widget.booking.studentName,
              style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
            ),
            SizedBox(height: 18.h),
            _DropdownField(
              label: 'Payment status',
              value: _paymentStatus,
              options: _paymentStatuses,
              onChanged: (v) => setState(() => _paymentStatus = v),
            ),
            SizedBox(height: 16.h),
            _DropdownField(
              label: 'Booking status',
              value: _bookingStatus,
              options: _bookingStatuses,
              onChanged: (v) => setState(() => _bookingStatus = v),
            ),
            SizedBox(height: 16.h),
            _DropdownField(
              label: 'Payment frequency',
              value: _frequency,
              options: _frequencies,
              onChanged: (v) => setState(() => _frequency = v),
            ),
            SizedBox(height: 16.h),
            Text(
              'Class start date',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13.5.sp,
                color: AppColors.textSecondary,
              ),
            ),
            SizedBox(height: 8.h),
            InkWell(
              borderRadius: BorderRadius.circular(16.r),
              onTap: _pickStartDate,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.calendar,
                        size: 18.sp, color: AppColors.textMuted),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Text(
                        _classStartDate == null
                            ? 'Select date'
                            : Formatters.date(_classStartDate),
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14.sp,
                          color: _classStartDate == null
                              ? AppColors.textMuted
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    Icon(LucideIcons.chevronDown,
                        size: 18.sp, color: AppColors.textMuted),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16.h),
            AppTextField(
              label: 'Fee per period (₹)',
              controller: _amount,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            SizedBox(height: 16.h),
            AppTextField(
              label: 'Remarks',
              controller: _remarks,
              hint: 'Internal notes (optional)',
              maxLines: 3,
              textInputAction: TextInputAction.newline,
            ),
            SizedBox(height: 24.h),
            PrimaryButton(label: 'Save changes', onPressed: _save),
          ],
        ),
      ),
    );
  }
}

class _DropdownField extends StatelessWidget {
  final String label;
  final String value;
  final List<String> options;
  final ValueChanged<String> onChanged;

  const _DropdownField({
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  String _cap(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13.5.sp,
            color: AppColors.textSecondary,
          ),
        ),
        SizedBox(height: 8.h),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          decoration: BoxDecoration(
            color: AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              borderRadius: BorderRadius.circular(16.r),
              items: options
                  .map((o) =>
                      DropdownMenuItem(value: o, child: Text(_cap(o))))
                  .toList(),
              onChanged: (v) {
                if (v != null) onChanged(v);
              },
            ),
          ),
        ),
      ],
    );
  }
}
