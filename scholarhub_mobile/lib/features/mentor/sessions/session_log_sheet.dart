import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/billing.dart';
import '../../../data/models/booking.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/primary_button.dart';

String _dateKey(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}';
}

String _fmtTime(TimeOfDay t) {
  final dt = DateTime(2000, 1, 1, t.hour, t.minute);
  return DateFormat('HH:mm').format(dt);
}

/// Log a new session against one of the mentor's confirmed bookings. Returns a
/// payload map (bookingId/date/startTime/endTime/subjectId?/notes?) or null.
Future<Map<String, dynamic>?> showLogSessionSheet(
  BuildContext context, {
  required List<Booking> bookings,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _LogSessionSheet(bookings: bookings),
    ),
  );
}

/// Edit an already-logged session (date/time/notes only). Returns the changed
/// fields or null.
Future<Map<String, dynamic>?> showEditSessionSheet(
  BuildContext context, {
  required SessionRecord session,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _EditSessionSheet(session: session),
    ),
  );
}

Widget _grabber() => Center(
      child: Container(
        height: 5.h,
        width: 44.w,
        margin: EdgeInsets.only(bottom: 16.h),
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(3.r),
        ),
      ),
    );

Widget _pickerTile({
  required IconData icon,
  required String label,
  required VoidCallback onTap,
}) {
  return Material(
    color: AppColors.surfaceMuted,
    borderRadius: BorderRadius.circular(14.r),
    child: InkWell(
      borderRadius: BorderRadius.circular(14.r),
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
        child: Row(
          children: [
            Icon(icon, size: 18.sp, color: AppColors.primary),
            SizedBox(width: 10.w),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _LogSessionSheet extends StatefulWidget {
  final List<Booking> bookings;
  const _LogSessionSheet({required this.bookings});

  @override
  State<_LogSessionSheet> createState() => _LogSessionSheetState();
}

class _LogSessionSheetState extends State<_LogSessionSheet> {
  Booking? _booking;
  DateTime? _date;
  TimeOfDay? _start;
  TimeOfDay? _end;
  String? _subjectId;
  final _notes = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.bookings.length == 1) _booking = widget.bookings.first;
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  bool get _needsSubject => _booking?.bookingType == 'multiple';

  void _submit() {
    if (_booking == null) {
      AppSnackbar.error(context, 'Please pick a booking.');
      return;
    }
    if (_date == null || _start == null || _end == null) {
      AppSnackbar.error(context, 'Please pick a date, start and end time.');
      return;
    }
    if (_needsSubject && (_subjectId == null || _subjectId!.isEmpty)) {
      AppSnackbar.error(context, 'Please pick a subject for this session.');
      return;
    }
    Navigator.pop(context, {
      'bookingId': _booking!.id,
      'date': _dateKey(_date!),
      'startTime': _fmtTime(_start!),
      'endTime': _fmtTime(_end!),
      if (_needsSubject) 'subjectId': _subjectId,
      if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
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
            _grabber(),
            Text('Log a session',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18.sp)),
            SizedBox(height: 14.h),
            if (widget.bookings.isEmpty)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 16.h),
                child: const Text(
                  'You have no confirmed bookings to log against yet.',
                  style: TextStyle(color: AppColors.textMuted),
                ),
              )
            else ...[
              _sectionLabel('Booking'),
              SizedBox(height: 8.h),
              _bookingDropdown(),
              if (_needsSubject) ...[
                SizedBox(height: 14.h),
                _sectionLabel('Subject'),
                SizedBox(height: 8.h),
                _subjectDropdown(),
              ],
              SizedBox(height: 14.h),
              _sectionLabel('Date'),
              SizedBox(height: 8.h),
              _pickerTile(
                icon: LucideIcons.calendar,
                label: _date == null ? 'Pick date' : Formatters.date(_date),
                onTap: () async {
                  final now = DateTime.now();
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: now,
                    firstDate: DateTime(now.year - 1),
                    lastDate: now, // sessions can't be in the future
                  );
                  if (picked != null) setState(() => _date = picked);
                },
              ),
              SizedBox(height: 12.h),
              Row(
                children: [
                  Expanded(
                    child: _pickerTile(
                      icon: LucideIcons.clock,
                      label: _start == null ? 'Start' : _fmtTime(_start!),
                      onTap: () async {
                        final t = await showTimePicker(
                            context: context, initialTime: TimeOfDay.now());
                        if (t != null) setState(() => _start = t);
                      },
                    ),
                  ),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: _pickerTile(
                      icon: LucideIcons.clock,
                      label: _end == null ? 'End' : _fmtTime(_end!),
                      onTap: () async {
                        final t = await showTimePicker(
                            context: context, initialTime: TimeOfDay.now());
                        if (t != null) setState(() => _end = t);
                      },
                    ),
                  ),
                ],
              ),
              SizedBox(height: 14.h),
              _sectionLabel('Notes (optional)'),
              SizedBox(height: 8.h),
              TextField(
                controller: _notes,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'What was covered…',
                ),
              ),
              SizedBox(height: 20.h),
              PrimaryButton(
                label: 'Log session',
                icon: LucideIcons.plus,
                onPressed: _submit,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _bookingDropdown() {
    return _DropdownShell(
      child: DropdownButton<String>(
        value: _booking?.id,
        isExpanded: true,
        hint: const Text('Select a booking'),
        borderRadius: BorderRadius.circular(16.r),
        items: widget.bookings
            .map((b) => DropdownMenuItem(
                  value: b.id,
                  child: Text(
                    b.studentName.isEmpty ? 'Student' : b.studentName,
                    overflow: TextOverflow.ellipsis,
                  ),
                ))
            .toList(),
        onChanged: (v) {
          setState(() {
            _booking = widget.bookings.firstWhere((b) => b.id == v);
            _subjectId = null;
          });
        },
      ),
    );
  }

  Widget _subjectDropdown() {
    final subjects = _booking?.subjectOptions ?? const <({String id, String name})>[];
    if (subjects.isEmpty) {
      return Text(
        'No subjects listed on this booking.',
        style: TextStyle(color: AppColors.textMuted, fontSize: 12.5.sp),
      );
    }
    return _DropdownShell(
      child: DropdownButton<String>(
        value: _subjectId,
        isExpanded: true,
        hint: const Text('Select a subject'),
        borderRadius: BorderRadius.circular(16.r),
        items: subjects
            .map((s) => DropdownMenuItem(
                  value: s.id,
                  child: Text(s.name, overflow: TextOverflow.ellipsis),
                ))
            .toList(),
        onChanged: (v) => setState(() => _subjectId = v),
      ),
    );
  }
}

class _EditSessionSheet extends StatefulWidget {
  final SessionRecord session;
  const _EditSessionSheet({required this.session});

  @override
  State<_EditSessionSheet> createState() => _EditSessionSheetState();
}

class _EditSessionSheetState extends State<_EditSessionSheet> {
  DateTime? _date;
  TimeOfDay? _start;
  TimeOfDay? _end;
  late final TextEditingController _notes;

  @override
  void initState() {
    super.initState();
    _date = widget.session.date;
    _start = _parseTime(widget.session.startTime);
    _end = _parseTime(widget.session.endTime);
    _notes = TextEditingController(text: widget.session.notes);
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  TimeOfDay? _parseTime(String raw) {
    final parts = raw.split(':');
    if (parts.length < 2) return null;
    final h = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (h == null || m == null) return null;
    return TimeOfDay(hour: h, minute: m);
  }

  void _submit() {
    if (_date == null || _start == null || _end == null) {
      AppSnackbar.error(context, 'Please pick a date, start and end time.');
      return;
    }
    Navigator.pop(context, {
      'date': _dateKey(_date!),
      'startTime': _fmtTime(_start!),
      'endTime': _fmtTime(_end!),
      'notes': _notes.text.trim(),
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
            _grabber(),
            Text('Edit session',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18.sp)),
            SizedBox(height: 14.h),
            _sectionLabel('Date'),
            SizedBox(height: 8.h),
            _pickerTile(
              icon: LucideIcons.calendar,
              label: _date == null ? 'Pick date' : Formatters.date(_date),
              onTap: () async {
                final now = DateTime.now();
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date ?? now,
                  firstDate: DateTime(now.year - 1),
                  lastDate: now,
                );
                if (picked != null) setState(() => _date = picked);
              },
            ),
            SizedBox(height: 12.h),
            Row(
              children: [
                Expanded(
                  child: _pickerTile(
                    icon: LucideIcons.clock,
                    label: _start == null ? 'Start' : _fmtTime(_start!),
                    onTap: () async {
                      final t = await showTimePicker(
                          context: context,
                          initialTime: _start ?? TimeOfDay.now());
                      if (t != null) setState(() => _start = t);
                    },
                  ),
                ),
                SizedBox(width: 10.w),
                Expanded(
                  child: _pickerTile(
                    icon: LucideIcons.clock,
                    label: _end == null ? 'End' : _fmtTime(_end!),
                    onTap: () async {
                      final t = await showTimePicker(
                          context: context,
                          initialTime: _end ?? TimeOfDay.now());
                      if (t != null) setState(() => _end = t);
                    },
                  ),
                ),
              ],
            ),
            SizedBox(height: 14.h),
            _sectionLabel('Notes (optional)'),
            SizedBox(height: 8.h),
            TextField(
              controller: _notes,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'What was covered…'),
            ),
            SizedBox(height: 20.h),
            PrimaryButton(
              label: 'Save changes',
              icon: LucideIcons.check,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}

Widget _sectionLabel(String text) => Text(
      text,
      style: TextStyle(
        fontWeight: FontWeight.w600,
        fontSize: 13.5.sp,
        color: AppColors.textSecondary,
      ),
    );

class _DropdownShell extends StatelessWidget {
  final Widget child;
  const _DropdownShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(child: child),
    );
  }
}
