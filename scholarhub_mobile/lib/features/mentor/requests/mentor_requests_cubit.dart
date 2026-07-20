import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/booking.dart';
import '../../../data/services/booking_service.dart';
import '../../../state/view_status.dart';

class MentorRequestsState extends Equatable {
  final ViewStatus status;
  final List<Booking> requests;
  final String? error;

  const MentorRequestsState({
    this.status = ViewStatus.initial,
    this.requests = const [],
    this.error,
  });

  MentorRequestsState copyWith({
    ViewStatus? status,
    List<Booking>? requests,
    String? error,
  }) {
    return MentorRequestsState(
      status: status ?? this.status,
      requests: requests ?? this.requests,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, requests, error];
}

/// Approved bookings awaiting this mentor's acceptance (SRD teacher-accept flow).
class MentorRequestsCubit extends Cubit<MentorRequestsState> {
  final BookingService _service;

  MentorRequestsCubit({BookingService? service})
      : _service = service ?? BookingService(),
        super(const MentorRequestsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final requests = await _service.mentorRequests();
      emit(state.copyWith(status: ViewStatus.success, requests: requests));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> accept(String bookingId) async {
    await _service.teacherAccept(bookingId);
    await load();
  }

  Future<void> decline(String bookingId, String? reason) async {
    await _service.teacherDecline(bookingId, reason: reason);
    await load();
  }
}
