import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/di/service_locator.dart';
import '../../../data/models/booking.dart';
import '../../../data/services/booking_service.dart';
import '../../../state/paged_state.dart';
import '../../../state/view_status.dart';

class AdminBookingsCubit extends Cubit<PagedState<Booking>> {
  final BookingService _service;
  final String userId;
  static const _limit = 20;
  String _search = '';

  AdminBookingsCubit(this.userId, {BookingService? service})
      : _service = service ?? sl<BookingService>(),
        super(const PagedState<Booking>());

  String get search => _search;

  Future<void> load({String? search}) async {
    if (search != null) _search = search;
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final res = await _service.getBookings(
        userId,
        page: 1,
        limit: _limit,
        search: _search,
      );
      emit(state.copyWith(
        status: ViewStatus.success,
        items: res.bookings,
        page: res.currentPage,
        totalPages: res.totalPages,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    try {
      final next = state.page + 1;
      final res = await _service.getBookings(
        userId,
        page: next,
        limit: _limit,
        search: _search,
      );
      emit(state.copyWith(
        items: [...state.items, ...res.bookings],
        page: res.currentPage,
        totalPages: res.totalPages,
        loadingMore: false,
      ));
    } catch (_) {
      emit(state.copyWith(loadingMore: false));
    }
  }

  Future<void> updateBooking(String id, Map<String, dynamic> data) async {
    await _service.updateBooking(id, data);
    await load();
  }

  Future<void> approve(String id) async {
    await _service.approveBooking(id);
    await load();
  }

  Future<void> reject(String id, String? reason) async {
    await _service.rejectBooking(id, reason: reason);
    await load();
  }

  Future<void> complete(String id) async {
    await _service.completeBooking(id);
    await load();
  }

  Future<void> closeBooking(String id) async {
    await _service.closeBooking(id);
    await load();
  }
}
