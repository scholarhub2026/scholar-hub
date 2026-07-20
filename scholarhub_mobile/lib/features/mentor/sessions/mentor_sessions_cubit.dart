import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/billing.dart';
import '../../../data/models/booking.dart';
import '../../../data/services/billing_service.dart';
import '../../../data/services/booking_service.dart';
import '../../../state/view_status.dart';

class MentorSessionsState extends Equatable {
  final ViewStatus status;
  final List<SessionRecord> sessions;
  final List<Booking> confirmedBookings;
  final String filter; // all | logged | verified | rejected
  final int loggedCount;
  final String? error;

  const MentorSessionsState({
    this.status = ViewStatus.initial,
    this.sessions = const [],
    this.confirmedBookings = const [],
    this.filter = 'all',
    this.loggedCount = 0,
    this.error,
  });

  MentorSessionsState copyWith({
    ViewStatus? status,
    List<SessionRecord>? sessions,
    List<Booking>? confirmedBookings,
    String? filter,
    int? loggedCount,
    String? error,
  }) {
    return MentorSessionsState(
      status: status ?? this.status,
      sessions: sessions ?? this.sessions,
      confirmedBookings: confirmedBookings ?? this.confirmedBookings,
      filter: filter ?? this.filter,
      loggedCount: loggedCount ?? this.loggedCount,
      error: error,
    );
  }

  @override
  List<Object?> get props =>
      [status, sessions, confirmedBookings, filter, loggedCount, error];
}

/// Mentor's logged/verified/rejected sessions plus the confirmed bookings that
/// are eligible for new session logs (SRD Sessions & Attendance).
class MentorSessionsCubit extends Cubit<MentorSessionsState> {
  final BillingService _billing;
  final BookingService _bookings;
  final String mentorId;

  MentorSessionsCubit(
    this.mentorId, {
    BillingService? billing,
    BookingService? bookings,
  })  : _billing = billing ?? BillingService(),
        _bookings = bookings ?? BookingService(),
        super(const MentorSessionsState());

  Future<void> load({String? filter}) async {
    final nextFilter = filter ?? state.filter;
    emit(state.copyWith(status: ViewStatus.loading, filter: nextFilter));
    try {
      final page = await _billing.getSessions(
        status: nextFilter == 'all' ? null : nextFilter,
        limit: 100,
      );
      // Confirmed bookings drive the "Log session" booking picker.
      final res = await _bookings.getBookings(mentorId, page: 1, limit: 100);
      final confirmed = res.bookings
          .where((b) => b.bookingStatus == 'confirmed')
          .toList();
      emit(state.copyWith(
        status: ViewStatus.success,
        sessions: page.sessions,
        confirmedBookings: confirmed,
        loggedCount: page.loggedCount,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> logSession({
    required String bookingId,
    required String date,
    required String startTime,
    required String endTime,
    String? subjectId,
    String? notes,
  }) async {
    await _billing.logSession(
      bookingId: bookingId,
      date: date,
      startTime: startTime,
      endTime: endTime,
      subjectId: subjectId,
      notes: notes,
    );
    await load();
  }

  Future<void> updateSession(
    String id, {
    String? date,
    String? startTime,
    String? endTime,
    String? notes,
  }) async {
    await _billing.updateSession(
      id,
      date: date,
      startTime: startTime,
      endTime: endTime,
      notes: notes,
    );
    await load();
  }

  Future<void> deleteSession(String id) async {
    await _billing.deleteSession(id);
    await load();
  }
}
