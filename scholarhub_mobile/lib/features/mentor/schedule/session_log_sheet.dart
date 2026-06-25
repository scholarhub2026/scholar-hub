import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking_log.dart';
import '../../../data/services/booking_log_service.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/primary_button.dart';
import '../../../widgets/state_views.dart';

/// View existing session logs for a booking and add a new one.
Future<void> showSessionLogSheet(BuildContext context, String bookingId) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, controller) =>
          _SessionLogSheet(bookingId: bookingId, scrollController: controller),
    ),
  );
}

class _SessionLogSheet extends StatefulWidget {
  final String bookingId;
  final ScrollController scrollController;
  const _SessionLogSheet({
    required this.bookingId,
    required this.scrollController,
  });

  @override
  State<_SessionLogSheet> createState() => _SessionLogSheetState();
}

class _SessionLogSheetState extends State<_SessionLogSheet> {
  final _service = BookingLogService();

  bool _loading = true;
  String? _error;
  List<BookingLog> _logs = [];

  DateTime? _date;
  TimeOfDay? _start;
  TimeOfDay? _end;
  bool _saving = false;

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
      final logs = await _service.getLogs(widget.bookingId);
      if (!mounted) return;
      setState(() {
        _logs = logs;
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

  String _fmtTime(TimeOfDay? t) {
    if (t == null) return '';
    final dt = DateTime(2000, 1, 1, t.hour, t.minute);
    return DateFormat('HH:mm').format(dt);
  }

  Future<void> _add() async {
    if (_date == null || _start == null || _end == null) {
      AppSnackbar.error(context, 'Please pick a date, start and end time.');
      return;
    }
    setState(() => _saving = true);
    try {
      await _service.createLog(
        widget.bookingId,
        date: _date!.toIso8601String(),
        startTime: _fmtTime(_start),
        endTime: _fmtTime(_end),
      );
      if (!mounted) return;
      setState(() {
        _date = null;
        _start = null;
        _end = null;
      });
      await _load();
      if (mounted) AppSnackbar.success(context, 'Session log added.');
    } on ApiException catch (e) {
      if (mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnackbar.error(context, 'Unable to add the log.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
      ),
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      child: ListView(
        controller: widget.scrollController,
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
          Text('Session logs',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18.sp)),
          SizedBox(height: 14.h),
          if (_loading)
            Padding(
              padding: EdgeInsets.symmetric(vertical: 24.h),
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            )
          else if (_error != null)
            ErrorStateView(message: _error!, onRetry: _load)
          else if (_logs.isEmpty)
            Padding(
              padding: EdgeInsets.symmetric(vertical: 16.h),
              child: const Text(
                'No session logs yet.',
                style: TextStyle(color: AppColors.textMuted),
              ),
            )
          else
            ..._logs.map(
              (l) => Padding(
                padding: EdgeInsets.only(bottom: 8.h),
                child: Container(
                  padding: EdgeInsets.all(12.r),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceMuted,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.clock,
                          size: 16.sp, color: AppColors.primary),
                      SizedBox(width: 10.w),
                      Expanded(
                        child: Text(
                          Formatters.date(l.date),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      Text(
                        '${l.startTime} – ${l.endTime}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          Divider(height: 28.h),
          Text('Add a log',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp)),
          SizedBox(height: 12.h),
          _pickerTile(
            icon: LucideIcons.calendar,
            label: _date == null ? 'Pick date' : Formatters.date(_date),
            onTap: () async {
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: now,
                firstDate: DateTime(now.year - 1),
                lastDate: DateTime(now.year + 1),
              );
              if (picked != null) setState(() => _date = picked);
            },
          ),
          SizedBox(height: 10.h),
          Row(
            children: [
              Expanded(
                child: _pickerTile(
                  icon: LucideIcons.clock,
                  label: _start == null ? 'Start' : _fmtTime(_start),
                  onTap: () async {
                    final t = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.now(),
                    );
                    if (t != null) setState(() => _start = t);
                  },
                ),
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: _pickerTile(
                  icon: LucideIcons.clock,
                  label: _end == null ? 'End' : _fmtTime(_end),
                  onTap: () async {
                    final t = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.now(),
                    );
                    if (t != null) setState(() => _end = t);
                  },
                ),
              ),
            ],
          ),
          SizedBox(height: 18.h),
          PrimaryButton(
            label: 'Add session log',
            icon: LucideIcons.plus,
            loading: _saving,
            onPressed: _saving ? null : _add,
          ),
        ],
      ),
    );
  }

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
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
