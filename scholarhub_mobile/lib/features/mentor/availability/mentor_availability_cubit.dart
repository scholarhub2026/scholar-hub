import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/mentor.dart';
import '../../../data/services/availability_service.dart';
import '../../../state/view_status.dart';

class MentorAvailabilityState extends Equatable {
  final ViewStatus status;
  final List<AvailabilitySlot> slots;
  final bool isAvailable;
  final bool saving;
  final String? error;

  const MentorAvailabilityState({
    this.status = ViewStatus.initial,
    this.slots = const [],
    this.isAvailable = true,
    this.saving = false,
    this.error,
  });

  /// Slots sorted Mon-first, then by start time — for stable display order.
  List<AvailabilitySlot> get sortedSlots {
    final list = [...slots];
    int mondayFirst(int d) => d == 0 ? 7 : d;
    list.sort((a, b) {
      final byDay = mondayFirst(a.dayOfWeek).compareTo(mondayFirst(b.dayOfWeek));
      return byDay != 0 ? byDay : a.startTime.compareTo(b.startTime);
    });
    return list;
  }

  MentorAvailabilityState copyWith({
    ViewStatus? status,
    List<AvailabilitySlot>? slots,
    bool? isAvailable,
    bool? saving,
    String? error,
  }) {
    return MentorAvailabilityState(
      status: status ?? this.status,
      slots: slots ?? this.slots,
      isAvailable: isAvailable ?? this.isAvailable,
      saving: saving ?? this.saving,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, slots, isAvailable, saving, error];
}

class MentorAvailabilityCubit extends Cubit<MentorAvailabilityState> {
  final AvailabilityService _service;
  final String mentorId;

  MentorAvailabilityCubit(this.mentorId, {AvailabilityService? service})
      : _service = service ?? AvailabilityService(),
        super(const MentorAvailabilityState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final res = await _service.getAvailability(mentorId);
      emit(state.copyWith(
        status: ViewStatus.success,
        slots: res.slots,
        isAvailable: res.isAvailable,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  void addSlot(AvailabilitySlot slot) {
    emit(state.copyWith(slots: [...state.slots, slot]));
  }

  void updateSlot(int index, AvailabilitySlot slot) {
    if (index < 0 || index >= state.slots.length) return;
    final next = [...state.slots];
    next[index] = slot;
    emit(state.copyWith(slots: next));
  }

  void removeSlot(int index) {
    if (index < 0 || index >= state.slots.length) return;
    final next = [...state.slots]..removeAt(index);
    emit(state.copyWith(slots: next));
  }

  void toggleAvailable(bool value) {
    emit(state.copyWith(isAvailable: value));
  }

  /// Persist the template. Returns true on success. On failure, surfaces the
  /// server message (e.g. overlapping slots) via [error].
  Future<bool> save() async {
    emit(state.copyWith(saving: true, error: null));
    try {
      await _service.updateWeeklyAvailability(
        mentorId,
        slots: state.slots,
        isAvailable: state.isAvailable,
      );
      emit(state.copyWith(saving: false));
      return true;
    } catch (e) {
      emit(state.copyWith(saving: false, error: e.toString()));
      return false;
    }
  }
}
