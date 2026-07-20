import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/primary_button.dart';

const _methods = ['bank-transfer', 'upi', 'cash', 'other'];

/// Record a payout to a mentor for a set of paid-but-unsettled invoices.
/// Returns { invoiceIds, amount?, method, reference?, note? } or null.
Future<Map<String, dynamic>?> showSettleSheet(
  BuildContext context, {
  required MentorPending mentor,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _SettleSheet(mentor: mentor),
    ),
  );
}

class _SettleSheet extends StatefulWidget {
  final MentorPending mentor;
  const _SettleSheet({required this.mentor});

  @override
  State<_SettleSheet> createState() => _SettleSheetState();
}

class _SettleSheetState extends State<_SettleSheet> {
  final Set<String> _checked = {};
  String _method = _methods.first;
  final _amount = TextEditingController();
  final _reference = TextEditingController();
  final _note = TextEditingController();
  bool _amountEdited = false;

  @override
  void initState() {
    super.initState();
    for (final inv in widget.mentor.invoices) {
      _checked.add(inv.id);
    }
    _amount.text = _checkedSum().toStringAsFixed(0);
  }

  @override
  void dispose() {
    _amount.dispose();
    _reference.dispose();
    _note.dispose();
    super.dispose();
  }

  num _checkedSum() {
    return widget.mentor.invoices
        .where((i) => _checked.contains(i.id))
        .fold<num>(0, (sum, i) => sum + i.amount);
  }

  void _toggle(String id) {
    setState(() {
      _checked.contains(id) ? _checked.remove(id) : _checked.add(id);
      // Keep the amount in sync with the checked sum until the admin edits it.
      if (!_amountEdited) _amount.text = _checkedSum().toStringAsFixed(0);
    });
  }

  void _submit() {
    if (_checked.isEmpty) {
      AppSnackbar.error(context, 'Select at least one invoice.');
      return;
    }
    final amount = num.tryParse(_amount.text.trim());
    Navigator.pop(context, {
      'invoiceIds': _checked.toList(),
      'amount': ?amount,
      'method': _method,
      if (_reference.text.trim().isNotEmpty) 'reference': _reference.text.trim(),
      if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
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
            Text('Record payout',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp)),
            SizedBox(height: 4.h),
            Text(
              widget.mentor.mentorName.isEmpty
                  ? 'Mentor'
                  : widget.mentor.mentorName,
              style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
            ),
            SizedBox(height: 16.h),
            _label('Invoices'),
            SizedBox(height: 8.h),
            ...widget.mentor.invoices.map((inv) {
              final checked = _checked.contains(inv.id);
              return Padding(
                padding: EdgeInsets.only(bottom: 8.h),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12.r),
                  onTap: () => _toggle(inv.id),
                  child: Container(
                    padding: EdgeInsets.all(12.r),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMuted,
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          checked
                              ? LucideIcons.checkSquare
                              : LucideIcons.square,
                          size: 20.sp,
                          color:
                              checked ? AppColors.primary : AppColors.textMuted,
                        ),
                        SizedBox(width: 10.w),
                        Expanded(
                          child: Text(
                            inv.invoiceNumber.isEmpty
                                ? 'Invoice'
                                : inv.invoiceNumber,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        Text(
                          Formatters.rupeesPlain(inv.amount),
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            SizedBox(height: 12.h),
            _label('Amount (₹)'),
            SizedBox(height: 8.h),
            TextField(
              controller: _amount,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => _amountEdited = true,
              decoration: const InputDecoration(prefixText: '₹ '),
            ),
            SizedBox(height: 14.h),
            _label('Method'),
            SizedBox(height: 8.h),
            _MethodDropdown(
              value: _method,
              onChanged: (v) => setState(() => _method = v),
            ),
            SizedBox(height: 14.h),
            _label('Reference (optional)'),
            SizedBox(height: 8.h),
            TextField(
              controller: _reference,
              decoration: const InputDecoration(
                hintText: 'UTR / txn id',
              ),
            ),
            SizedBox(height: 14.h),
            _label('Note (optional)'),
            SizedBox(height: 8.h),
            TextField(
              controller: _note,
              maxLines: 2,
              decoration: const InputDecoration(hintText: 'Internal note'),
            ),
            SizedBox(height: 22.h),
            PrimaryButton(
              label: 'Record payout',
              icon: LucideIcons.check,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13.5.sp,
          color: AppColors.textSecondary,
        ),
      );
}

class _MethodDropdown extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;
  const _MethodDropdown({required this.value, required this.onChanged});

  String _label(String m) {
    switch (m) {
      case 'bank-transfer':
        return 'Bank transfer';
      case 'upi':
        return 'UPI';
      case 'cash':
        return 'Cash';
      default:
        return 'Other';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
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
          items: _methods
              .map((m) => DropdownMenuItem(value: m, child: Text(_label(m))))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}
