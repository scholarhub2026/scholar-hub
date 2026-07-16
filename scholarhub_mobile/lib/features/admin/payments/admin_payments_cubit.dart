import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/booking.dart';
import '../../../data/services/booking_service.dart';
import '../../../state/view_status.dart';

class AdminPaymentsState extends Equatable {
  final ViewStatus status;
  final List<Booking> items;
  final int page;
  final int totalPages;
  final bool loadingMore;
  final String scope; // all | overdue | today | upcoming
  final int overdue;
  final int dueToday;
  final int upcoming;
  final String? error;

  const AdminPaymentsState({
    this.status = ViewStatus.initial,
    this.items = const [],
    this.page = 1,
    this.totalPages = 1,
    this.loadingMore = false,
    this.scope = 'all',
    this.overdue = 0,
    this.dueToday = 0,
    this.upcoming = 0,
    this.error,
  });

  bool get hasMore => page < totalPages;

  AdminPaymentsState copyWith({
    ViewStatus? status,
    List<Booking>? items,
    int? page,
    int? totalPages,
    bool? loadingMore,
    String? scope,
    int? overdue,
    int? dueToday,
    int? upcoming,
    String? error,
  }) {
    return AdminPaymentsState(
      status: status ?? this.status,
      items: items ?? this.items,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      loadingMore: loadingMore ?? this.loadingMore,
      scope: scope ?? this.scope,
      overdue: overdue ?? this.overdue,
      dueToday: dueToday ?? this.dueToday,
      upcoming: upcoming ?? this.upcoming,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
        status,
        items,
        page,
        totalPages,
        loadingMore,
        scope,
        overdue,
        dueToday,
        upcoming,
        error,
      ];
}

class AdminPaymentsCubit extends Cubit<AdminPaymentsState> {
  final BookingService _service;
  static const _limit = 20;
  String _search = '';

  AdminPaymentsCubit({BookingService? service})
      : _service = service ?? BookingService(),
        super(const AdminPaymentsState());

  String get search => _search;

  Future<void> load({String? scope, String? search}) async {
    final nextScope = scope ?? state.scope;
    if (search != null) _search = search;
    emit(state.copyWith(status: ViewStatus.loading, scope: nextScope));
    try {
      final res = await _service.getDuePayments(
        scope: nextScope,
        page: 1,
        limit: _limit,
        search: _search,
      );
      emit(state.copyWith(
        status: ViewStatus.success,
        items: res.bookings,
        page: res.currentPage,
        totalPages: res.totalPages,
        overdue: res.overdue,
        dueToday: res.dueToday,
        upcoming: res.upcoming,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    try {
      final res = await _service.getDuePayments(
        scope: state.scope,
        page: state.page + 1,
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

  Future<void> markPaid(String id, {num? amount, String? note}) async {
    await _service.recordPayment(id, amount: amount, note: note);
    await load();
  }
}
