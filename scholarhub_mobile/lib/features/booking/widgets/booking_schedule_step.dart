import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/booking_draft.dart';
import '../../../data/models/mentor.dart';
import '../../../data/services/availability_service.dart';
import '../../../widgets/state_views.dart';

/// Days rendered Monday-first (JS/`getDay()` weekday numbers).
const _weekDays = <(int, String)>[
  (1, 'Monday'),
  (2, 'Tuesday'),
  (3, 'Wednesday'),
  (4, 'Thursday'),
  (5, 'Friday'),
  (6, 'Saturday'),
  (0, 'Sunday'),
];

/// Booking wizard step where the student picks WHEN — a recurring weekly slot
/// or a one-off dated session — from the mentor's published availability.
class BookingScheduleStep extends StatefulWidget {
  final BookingDraft draft;
  final VoidCallback onChanged;

  const BookingScheduleStep({
    super.key,
    required this.draft,
    required this.onChanged,
  });

  @override
  State<BookingScheduleStep> createState() => _BookingScheduleStepState();
}

class _BookingScheduleStepState extends State<BookingScheduleStep> {
  final _service = AvailabilityService();

  bool _loading = true;
  String? _error;
  List<AvailabilitySlot> _slots = const [];
  DateTime? _pickedDate;

  BookingDraft get draft => widget.draft;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _service.getAvailability(draft.mentor.id);
      if (!mounted) return;
      setState(() {
        _slots = res.slots.where((s) => s.isActive).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  // ---- selection helpers ----

  bool _isRecurringSelected(AvailabilitySlot s) =>
      draft.selectedSlots.any((sel) =>
          sel.slotId == s.id && sel.cadence == ScheduleCadence.recurring);

  bool _isSingleSelected(AvailabilitySlot s, DateTime date) =>
      draft.selectedSlots.any((sel) =>
          sel.slotId == s.id &&
          sel.cadence == ScheduleCadence.single &&
          sel.date != null &&
          slotDateKey(sel.date!) == slotDateKey(date));

  void _toggleRecurring(AvailabilitySlot s) {
    final selected = _isRecurringSelected(s);
    if (selected) {
      draft.selectedSlots.removeWhere((sel) =>
          sel.slotId == s.id && sel.cadence == ScheduleCadence.recurring);
    } else {
      draft.selectedSlots.add(SelectedSlot(
        slotId: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        cadence: ScheduleCadence.recurring,
      ));
    }
    widget.onChanged();
    setState(() {});
  }

  void _toggleSingle(AvailabilitySlot s, DateTime date) {
    final selected = _isSingleSelected(s, date);
    if (selected) {
      draft.selectedSlots.removeWhere((sel) =>
          sel.slotId == s.id &&
          sel.cadence == ScheduleCadence.single &&
          sel.date != null &&
          slotDateKey(sel.date!) == slotDateKey(date));
    } else {
      draft.selectedSlots.add(SelectedSlot(
        slotId: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        cadence: ScheduleCadence.single,
        date: date,
      ));
    }
    widget.onChanged();
    setState(() {});
  }

  void _setCadence(ScheduleCadence c) {
    if (draft.scheduleCadence == c) return;
    draft.scheduleCadence = c;
    draft.selectedSlots.clear(); // selections don't carry across modes
    _pickedDate = null;
    widget.onChanged();
    setState(() {});
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _pickedDate ?? now,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 60)),
    );
    if (picked == null) return;
    setState(() {
      _pickedDate = picked;
      // Only one date is shown at a time; drop single picks from other dates.
      draft.selectedSlots.clear();
    });
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
      children: [
        Text(
          'When would you like to learn?',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 4.h),
        Text(
          'Pick a repeating weekly time or a one-off session. Choose only the '
          'slots you need.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
        ),
        SizedBox(height: 18.h),
        _cadenceSelector(),
        SizedBox(height: 20.h),
        _frequencyHeader(),
        SizedBox(height: 10.h),
        _frequencySelector(),
        SizedBox(height: 20.h),
        if (draft.scheduleCadence == ScheduleCadence.recurring) ...[
          Text(
            'Class start date',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 14.sp,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 10.h),
          _startDateTile(),
          SizedBox(height: 20.h),
        ],
        if (_loading)
          Padding(
            padding: EdgeInsets.symmetric(vertical: 40.h),
            child: const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          )
        else if (_error != null)
          ErrorStateView(message: _error!, onRetry: _load)
        else if (_slots.isEmpty)
          _empty('This mentor hasn’t published availability yet.')
        else if (draft.scheduleCadence == ScheduleCadence.recurring)
          _recurringList()
        else
          _singleSection(),
      ],
    );
  }

  Widget _cadenceSelector() {
    Widget card(ScheduleCadence c, IconData icon, String subtitle) {
      final selected = draft.scheduleCadence == c;
      return Expanded(
        child: Padding(
          padding: EdgeInsets.only(right: c == ScheduleCadence.recurring ? 10.w : 0),
          child: GestureDetector(
            onTap: () => _setCadence(c),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: EdgeInsets.symmetric(vertical: 14.h, horizontal: 12.w),
              decoration: BoxDecoration(
                gradient: selected ? AppColors.brandGradient : null,
                color: selected ? null : AppColors.surface,
                borderRadius: BorderRadius.circular(14.r),
                border: Border.all(
                  color: selected ? Colors.transparent : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  Icon(icon,
                      size: 20.sp,
                      color: selected ? Colors.white : AppColors.primary),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c.label,
                          style: TextStyle(
                            fontSize: 13.5.sp,
                            fontWeight: FontWeight.w700,
                            color:
                                selected ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10.5.sp,
                            color: selected
                                ? Colors.white.withValues(alpha: 0.9)
                                : AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Row(
      children: [
        card(ScheduleCadence.recurring, LucideIcons.repeat, 'Same time weekly'),
        card(ScheduleCadence.single, LucideIcons.calendar, 'One-off session'),
      ],
    );
  }

  Widget _frequencyHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'How would you like to pay?',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14.sp,
            color: AppColors.textPrimary,
          ),
        ),
        SizedBox(height: 2.h),
        Text(
          'Fees are collected after classes — no payment now.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12.sp),
        ),
      ],
    );
  }

  Widget _frequencySelector() {
    Widget card(PaymentFrequency f, IconData icon) {
      final selected = draft.paymentFrequency == f;
      return Expanded(
        child: Padding(
          padding:
              EdgeInsets.only(right: f == PaymentFrequency.monthly ? 0 : 8.w),
          child: GestureDetector(
            onTap: () {
              draft.paymentFrequency = f;
              widget.onChanged();
              setState(() {});
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: EdgeInsets.symmetric(vertical: 12.h),
              decoration: BoxDecoration(
                gradient: selected ? AppColors.brandGradient : null,
                color: selected ? null : AppColors.surface,
                borderRadius: BorderRadius.circular(14.r),
                border: Border.all(
                  color: selected ? Colors.transparent : AppColors.border,
                ),
              ),
              child: Column(
                children: [
                  Icon(icon,
                      size: 18.sp,
                      color: selected ? Colors.white : AppColors.primary),
                  SizedBox(height: 6.h),
                  Text(
                    f.label,
                    style: TextStyle(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Row(
      children: [
        card(PaymentFrequency.daily, LucideIcons.sun),
        card(PaymentFrequency.weekly, LucideIcons.repeat),
        card(PaymentFrequency.monthly, LucideIcons.calendarDays),
      ],
    );
  }

  Widget _startDateTile() {
    final label = draft.classStartDate == null
        ? 'Pick your class start date'
        : DateFormat('EEEE, d MMM yyyy').format(draft.classStartDate!);
    return Material(
      color: AppColors.surfaceMuted,
      borderRadius: BorderRadius.circular(14.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(14.r),
        onTap: () async {
          final now = DateTime.now();
          final picked = await showDatePicker(
            context: context,
            initialDate: draft.classStartDate ?? now,
            firstDate: DateTime(now.year, now.month, now.day),
            lastDate: now.add(const Duration(days: 90)),
          );
          if (picked == null) return;
          setState(() => draft.classStartDate = picked);
          widget.onChanged();
        },
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
          child: Row(
            children: [
              Icon(LucideIcons.calendarCheck,
                  size: 18.sp, color: AppColors.primary),
              SizedBox(width: 10.w),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              Icon(LucideIcons.chevronDown,
                  size: 18.sp, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }

  Widget _recurringList() {
    final children = <Widget>[];
    for (final day in _weekDays) {
      final daySlots =
          _slots.where((s) => s.dayOfWeek == day.$1).toList()
            ..sort((a, b) => a.startTime.compareTo(b.startTime));
      if (daySlots.isEmpty) continue;
      children.add(_dayHeader(day.$2));
      for (final s in daySlots) {
        final left = s.recurringLeft;
        children.add(_slotTile(
          selected: _isRecurringSelected(s),
          disabled: left <= 0,
          slot: s,
          seatsLeft: left,
          onTap: () => _toggleRecurring(s),
        ));
      }
    }
    if (children.isEmpty) {
      return _empty('This mentor hasn’t published availability yet.');
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }

  Widget _singleSection() {
    final children = <Widget>[
      _pickDateTile(),
    ];
    if (_pickedDate != null) {
      final jsDay = _pickedDate!.weekday % 7; // Dart Mon=1..Sun=7 -> 0..6
      final key = slotDateKey(_pickedDate!);
      final daySlots =
          _slots.where((s) => s.dayOfWeek == jsDay).toList()
            ..sort((a, b) => a.startTime.compareTo(b.startTime));
      children.add(SizedBox(height: 16.h));
      if (daySlots.isEmpty) {
        children.add(_empty('No slots on this day. Try another date.'));
      } else {
        for (final s in daySlots) {
          final left = s.remainingOn(key);
          children.add(_slotTile(
            selected: _isSingleSelected(s, _pickedDate!),
            disabled: left <= 0,
            slot: s,
            seatsLeft: left,
            onTap: () => _toggleSingle(s, _pickedDate!),
          ));
        }
      }
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }

  Widget _pickDateTile() {
    final label = _pickedDate == null
        ? 'Pick a date'
        : DateFormat('EEEE, d MMM').format(_pickedDate!);
    return Material(
      color: AppColors.surfaceMuted,
      borderRadius: BorderRadius.circular(14.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(14.r),
        onTap: _pickDate,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
          child: Row(
            children: [
              Icon(LucideIcons.calendar, size: 18.sp, color: AppColors.primary),
              SizedBox(width: 10.w),
              Text(label,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              const Spacer(),
              Icon(LucideIcons.chevronDown,
                  size: 18.sp, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }

  Widget _dayHeader(String label) => Padding(
        padding: EdgeInsets.only(top: 6.h, bottom: 8.h),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14.sp,
            color: AppColors.textPrimary,
          ),
        ),
      );

  Widget _slotTile({
    required bool selected,
    required bool disabled,
    required AvailabilitySlot slot,
    required int seatsLeft,
    required VoidCallback onTap,
  }) {
    final borderColor = disabled
        ? AppColors.border
        : (selected ? AppColors.primary : AppColors.border);
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Opacity(
        opacity: disabled ? 0.55 : 1,
        child: GestureDetector(
          onTap: disabled ? null : onTap,
          child: Container(
            padding: EdgeInsets.all(14.r),
            decoration: BoxDecoration(
              color: selected ? AppColors.primaryLight : AppColors.surface,
              borderRadius: BorderRadius.circular(14.r),
              border: Border.all(
                color: borderColor,
                width: selected ? 1.6 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  selected ? LucideIcons.checkCircle2 : LucideIcons.circle,
                  color: selected ? AppColors.primary : AppColors.textMuted,
                  size: 22.sp,
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    slot.rangeLabel,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14.5.sp,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                _seatBadge(slot, disabled, seatsLeft),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _seatBadge(AvailabilitySlot slot, bool disabled, int seatsLeft) {
    late final String label;
    late final Color bg;
    late final Color fg;
    if (disabled) {
      label = 'Full';
      bg = AppColors.dangerSoft;
      fg = AppColors.danger;
    } else if (slot.isGroup) {
      label = '$seatsLeft left';
      bg = AppColors.primaryLight;
      fg = AppColors.primary;
    } else {
      label = '1-on-1';
      bg = AppColors.successSoft;
      fg = AppColors.success;
    }
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 10.5.sp, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }

  Widget _empty(String message) => Padding(
        padding: EdgeInsets.symmetric(vertical: 20.h),
        child: Row(
          children: [
            Icon(LucideIcons.calendarX, size: 18.sp, color: AppColors.textMuted),
            SizedBox(width: 10.w),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: AppColors.textMuted, fontSize: 13.sp),
              ),
            ),
          ],
        ),
      );
}
