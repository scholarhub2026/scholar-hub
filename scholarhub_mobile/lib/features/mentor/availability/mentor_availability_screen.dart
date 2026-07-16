import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/mentor.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/primary_button.dart';
import '../../../widgets/state_views.dart';
import 'mentor_availability_cubit.dart';

/// Days rendered Monday-first. Each entry maps a label to the JS/`getDay()`
/// weekday number the backend expects (0 = Sunday … 6 = Saturday).
const _weekDays = <(int, String)>[
  (1, 'Monday'),
  (2, 'Tuesday'),
  (3, 'Wednesday'),
  (4, 'Thursday'),
  (5, 'Friday'),
  (6, 'Saturday'),
  (0, 'Sunday'),
];

String _fmt(TimeOfDay t) =>
    '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

TimeOfDay? _parseTime(String hhmm) {
  final parts = hhmm.split(':');
  if (parts.length != 2) return null;
  final h = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (h == null || m == null) return null;
  return TimeOfDay(hour: h, minute: m);
}

/// Mentor screen to manage the weekly availability template that students book.
class MentorAvailabilityScreen extends StatelessWidget {
  final String mentorId;
  const MentorAvailabilityScreen({super.key, required this.mentorId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => MentorAvailabilityCubit(mentorId)..load(),
      child: const _AvailabilityView(),
    );
  }
}

class _AvailabilityView extends StatelessWidget {
  const _AvailabilityView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Weekly availability')),
      body: BlocConsumer<MentorAvailabilityCubit, MentorAvailabilityState>(
        listenWhen: (a, b) => a.error != b.error && b.error != null,
        listener: (context, state) {
          if (state.error != null) AppSnackbar.error(context, state.error!);
        },
        builder: (context, state) {
          if (state.status.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (state.status.isFailure && state.slots.isEmpty) {
            return ErrorStateView(
              message: state.error ?? 'Unable to load availability.',
              onRetry: () => context.read<MentorAvailabilityCubit>().load(),
            );
          }
          return Column(
            children: [
              Expanded(child: _body(context, state)),
              _saveBar(context, state),
            ],
          );
        },
      ),
    );
  }

  Widget _body(BuildContext context, MentorAvailabilityState state) {
    final cubit = context.read<MentorAvailabilityCubit>();
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
      children: [
        _acceptingCard(context, state),
        SizedBox(height: 18.h),
        Text(
          'Set the time ranges you teach each day. Leave a day empty to be off '
          '(e.g. weekends). Students book the slots you add here.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13.sp),
        ),
        SizedBox(height: 16.h),
        for (final day in _weekDays) _daySection(context, cubit, state, day),
      ],
    );
  }

  Widget _acceptingCard(BuildContext context, MentorAvailabilityState state) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 6.h),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: AppColors.border),
      ),
      child: SwitchListTile(
        contentPadding: EdgeInsets.zero,
        activeThumbColor: AppColors.primary,
        title: const Text(
          'Accepting bookings',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          state.isAvailable
              ? 'Students can book your open slots.'
              : 'Your slots are hidden from students.',
          style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
        ),
        value: state.isAvailable,
        onChanged: (v) => context.read<MentorAvailabilityCubit>().toggleAvailable(v),
      ),
    );
  }

  Widget _daySection(
    BuildContext context,
    MentorAvailabilityCubit cubit,
    MentorAvailabilityState state,
    (int, String) day,
  ) {
    // (real index in cubit list, slot) for this weekday, sorted by start time.
    final entries = <(int, AvailabilitySlot)>[];
    for (var i = 0; i < state.slots.length; i++) {
      if (state.slots[i].dayOfWeek == day.$1) entries.add((i, state.slots[i]));
    }
    entries.sort((a, b) => a.$2.startTime.compareTo(b.$2.startTime));

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                day.$2,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15.sp,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _openSheet(context, cubit, dayOfWeek: day.$1),
                icon: Icon(LucideIcons.plus, size: 16.sp),
                label: const Text('Add time'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: EdgeInsets.symmetric(horizontal: 8.w),
                ),
              ),
            ],
          ),
          if (entries.isEmpty)
            Padding(
              padding: EdgeInsets.symmetric(vertical: 4.h),
              child: Text(
                'Off — no slots',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12.5.sp),
              ),
            )
          else
            ...entries.map((e) => _slotRow(context, cubit, e.$1, e.$2)),
        ],
      ),
    );
  }

  Widget _slotRow(
    BuildContext context,
    MentorAvailabilityCubit cubit,
    int index,
    AvailabilitySlot slot,
  ) {
    return Padding(
      padding: EdgeInsets.only(top: 8.h),
      child: Material(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(12.r),
        child: InkWell(
          borderRadius: BorderRadius.circular(12.r),
          onTap: () => _openSheet(context, cubit, editIndex: index, existing: slot),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            child: Row(
              children: [
                Icon(LucideIcons.clock, size: 16.sp, color: AppColors.primary),
                SizedBox(width: 10.w),
                Text(
                  '${slot.startTime} – ${slot.endTime}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                SizedBox(width: 10.w),
                _capacityBadge(slot),
                const Spacer(),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  icon: Icon(LucideIcons.trash2,
                      size: 16.sp, color: AppColors.danger),
                  onPressed: () => cubit.removeSlot(index),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _capacityBadge(AvailabilitySlot slot) {
    final isGroup = slot.isGroup;
    final label = isGroup ? 'Group · ${slot.capacity}' : '1-on-1';
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: isGroup ? AppColors.primaryLight : AppColors.successSoft,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10.5.sp,
          fontWeight: FontWeight.w700,
          color: isGroup ? AppColors.primary : AppColors.success,
        ),
      ),
    );
  }

  Widget _saveBar(BuildContext context, MentorAvailabilityState state) {
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 16.h),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: PrimaryButton(
          label: 'Save availability',
          icon: LucideIcons.check,
          loading: state.saving,
          onPressed: state.saving
              ? null
              : () async {
                  final ok = await context.read<MentorAvailabilityCubit>().save();
                  if (ok && context.mounted) {
                    AppSnackbar.success(context, 'Availability saved.');
                  }
                },
        ),
      ),
    );
  }

  Future<void> _openSheet(
    BuildContext context,
    MentorAvailabilityCubit cubit, {
    int? dayOfWeek,
    int? editIndex,
    AvailabilitySlot? existing,
  }) async {
    final result = await showModalBottomSheet<AvailabilitySlot>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SlotSheet(
        dayOfWeek: dayOfWeek ?? existing?.dayOfWeek ?? 1,
        existing: existing,
      ),
    );
    if (result == null) return;
    if (editIndex != null) {
      cubit.updateSlot(editIndex, result);
    } else {
      cubit.addSlot(result);
    }
  }
}

/// Bottom sheet to add or edit one slot: start/end time, and 1-on-1 vs group
/// with a seat count.
class _SlotSheet extends StatefulWidget {
  final int dayOfWeek;
  final AvailabilitySlot? existing;
  const _SlotSheet({required this.dayOfWeek, this.existing});

  @override
  State<_SlotSheet> createState() => _SlotSheetState();
}

class _SlotSheetState extends State<_SlotSheet> {
  TimeOfDay? _start;
  TimeOfDay? _end;
  bool _isGroup = false;
  int _capacity = 2;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _start = _parseTime(e.startTime);
      _end = _parseTime(e.endTime);
      _isGroup = e.isGroup;
      _capacity = e.isGroup ? e.capacity : 2;
    }
  }

  void _save() {
    if (_start == null || _end == null) {
      AppSnackbar.error(context, 'Pick a start and end time.');
      return;
    }
    final start = _fmt(_start!);
    final end = _fmt(_end!);
    if (end.compareTo(start) <= 0) {
      AppSnackbar.error(context, 'End time must be after start time.');
      return;
    }
    Navigator.pop(
      context,
      AvailabilitySlot(
        id: widget.existing?.id ?? '',
        dayOfWeek: widget.dayOfWeek,
        startTime: start,
        endTime: end,
        capacity: _isGroup ? _capacity : 1,
        isActive: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
      ),
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
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
              widget.existing == null ? 'Add a slot' : 'Edit slot',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18.sp),
            ),
            SizedBox(height: 16.h),
            Row(
              children: [
                Expanded(
                  child: _pickerTile(
                    label: _start == null ? 'Start' : _fmt(_start!),
                    onTap: () async {
                      final t = await showTimePicker(
                        context: context,
                        initialTime: _start ?? const TimeOfDay(hour: 18, minute: 0),
                      );
                      if (t != null) setState(() => _start = t);
                    },
                  ),
                ),
                SizedBox(width: 10.w),
                Expanded(
                  child: _pickerTile(
                    label: _end == null ? 'End' : _fmt(_end!),
                    onTap: () async {
                      final t = await showTimePicker(
                        context: context,
                        initialTime: _end ?? const TimeOfDay(hour: 19, minute: 0),
                      );
                      if (t != null) setState(() => _end = t);
                    },
                  ),
                ),
              ],
            ),
            SizedBox(height: 18.h),
            const Text('Capacity', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(height: 10.h),
            Row(
              children: [
                _modeChip('1-on-1', !_isGroup, () => setState(() => _isGroup = false)),
                SizedBox(width: 10.w),
                _modeChip('Group', _isGroup, () => setState(() => _isGroup = true)),
              ],
            ),
            if (_isGroup) ...[
              SizedBox(height: 14.h),
              Row(
                children: [
                  Text('Seats', style: TextStyle(fontSize: 13.5.sp)),
                  const Spacer(),
                  _stepButton(LucideIcons.minus,
                      () => setState(() => _capacity = (_capacity - 1).clamp(2, 99))),
                  SizedBox(width: 14.w),
                  Text('$_capacity',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 16.sp)),
                  SizedBox(width: 14.w),
                  _stepButton(LucideIcons.plus,
                      () => setState(() => _capacity = (_capacity + 1).clamp(2, 99))),
                ],
              ),
            ],
            SizedBox(height: 20.h),
            PrimaryButton(
              label: widget.existing == null ? 'Add slot' : 'Save slot',
              icon: LucideIcons.check,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }

  Widget _pickerTile({required String label, required VoidCallback onTap}) {
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
              Icon(LucideIcons.clock, size: 18.sp, color: AppColors.primary),
              SizedBox(width: 10.w),
              Text(label,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeChip(String label, bool selected, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: EdgeInsets.symmetric(vertical: 12.h),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: selected ? AppColors.brandGradient : null,
            color: selected ? null : AppColors.surface,
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(
              color: selected ? Colors.transparent : AppColors.border,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: selected ? Colors.white : AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _stepButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      borderRadius: BorderRadius.circular(10.r),
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(8.r),
        decoration: BoxDecoration(
          color: AppColors.surfaceMuted,
          borderRadius: BorderRadius.circular(10.r),
        ),
        child: Icon(icon, size: 16.sp, color: AppColors.primary),
      ),
    );
  }
}
