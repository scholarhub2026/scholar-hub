import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/enquiry.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/primary_button.dart';

const _frequencies = <String>['weekly', 'monthly'];

/// Bottom sheet used by the admin to turn an enquiry into a confirmed flat-fee
/// booking. Returns `{totalAmount, paymentFrequency, classStartDate}` (the date
/// as `YYYY-MM-DD`) or null if dismissed.
Future<Map<String, dynamic>?> showCreateBookingSheet(
  BuildContext context, {
  required EnquiryRecord enquiry,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _CreateBookingSheet(enquiry: enquiry),
    ),
  );
}

/// "YYYY-MM-DD" from the picked local calendar day (no timezone shift).
String _ymd(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}';
}

class _CreateBookingSheet extends StatefulWidget {
  final EnquiryRecord enquiry;
  const _CreateBookingSheet({required this.enquiry});

  @override
  State<_CreateBookingSheet> createState() => _CreateBookingSheetState();
}

class _CreateBookingSheetState extends State<_CreateBookingSheet> {
  late final TextEditingController _amount;
  String _frequency = 'monthly';
  DateTime _startDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _amount = TextEditingController(
      text: widget.enquiry.estimatedAmount.toStringAsFixed(0),
    );
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  void _save() {
    Navigator.pop(context, {
      'totalAmount': num.tryParse(_amount.text.trim()) ?? 0,
      'paymentFrequency': _frequency,
      'classStartDate': _ymd(_startDate),
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
              'Create booking',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp),
            ),
            SizedBox(height: 4.h),
            Text(
              '${widget.enquiry.studentName.isEmpty ? 'Student' : widget.enquiry.studentName} · ${widget.enquiry.mentorName.isEmpty ? 'Mentor' : widget.enquiry.mentorName}'
              '${widget.enquiry.isDemo ? ' · Demo class' : (widget.enquiry.className.isEmpty ? '' : ' · ${widget.enquiry.className}')}',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
            ),
            SizedBox(height: 18.h),
            AppTextField(
              label: 'Fee per period (₹)',
              controller: _amount,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            SizedBox(height: 16.h),
            Text(
              'Payment frequency',
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
                  value: _frequency,
                  isExpanded: true,
                  borderRadius: BorderRadius.circular(16.r),
                  items: _frequencies
                      .map((f) => DropdownMenuItem(
                            value: f,
                            child: Text(f == 'weekly' ? 'Weekly' : 'Monthly'),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _frequency = v);
                  },
                ),
              ),
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
              onTap: _pickDate,
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
                        Formatters.date(_startDate),
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    Icon(LucideIcons.chevronDown,
                        size: 18.sp, color: AppColors.textMuted),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24.h),
            PrimaryButton(label: 'Create booking', onPressed: _save),
          ],
        ),
      ),
    );
  }
}
