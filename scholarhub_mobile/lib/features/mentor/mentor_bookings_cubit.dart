import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/booking.dart';
import '../../data/services/booking_service.dart';
import '../../state/view_status.dart';

class MentorBookingsState extends Equatable {
  final ViewStatus status;
  final List<Booking> bookings;
  final String? error;

  const MentorBookingsState({
    this.status = ViewStatus.initial,
    this.bookings = const [],
    this.error,
  });

  /// Total amount actually collected (paid bookings).
  num get totalEarnings => bookings
      .where((b) => b.paymentStatus == 'completed')
      .fold<num>(0, (sum, b) => sum + b.totalAmount);

  /// Amount still genuinely outstanding — only 'pending' (excludes 'completed'
  /// which is already collected, and 'failed' which won't be collected).
  num get pendingEarnings => bookings
      .where((b) => b.paymentStatus == 'pending')
      .fold<num>(0, (sum, b) => sum + b.totalAmount);

  int get completedSessions =>
      bookings.where((b) => b.bookingStatus == 'completed').length;

  int get upcomingSessions => bookings
      .where((b) =>
          b.bookingStatus == 'confirmed' || b.bookingStatus == 'pending')
      .length;

  MentorBookingsState copyWith({
    ViewStatus? status,
    List<Booking>? bookings,
    String? error,
  }) {
    return MentorBookingsState(
      status: status ?? this.status,
      bookings: bookings ?? this.bookings,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, bookings, error];
}

class MentorBookingsCubit extends Cubit<MentorBookingsState> {
  final BookingService _service;
  final String mentorId;

  MentorBookingsCubit(this.mentorId, {BookingService? service})
      : _service = service ?? BookingService(),
        super(const MentorBookingsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final res = await _service.getBookings(mentorId, page: 1, limit: 100);
      emit(state.copyWith(
        status: ViewStatus.success,
        bookings: res.bookings,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }
}
