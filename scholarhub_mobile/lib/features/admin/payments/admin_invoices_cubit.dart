import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/billing.dart';
import '../../../data/services/billing_service.dart';
import '../../../state/view_status.dart';

class AdminInvoicesState extends Equatable {
  final ViewStatus status;
  final List<InvoiceRecord> items;
  final int page;
  final int totalPages;
  final bool loadingMore;
  final String scope; // all | due | overdue | paid | settled
  final int due;
  final int paid;
  final int settled;
  final String? error;

  const AdminInvoicesState({
    this.status = ViewStatus.initial,
    this.items = const [],
    this.page = 1,
    this.totalPages = 1,
    this.loadingMore = false,
    this.scope = 'all',
    this.due = 0,
    this.paid = 0,
    this.settled = 0,
    this.error,
  });

  bool get hasMore => page < totalPages;

  AdminInvoicesState copyWith({
    ViewStatus? status,
    List<InvoiceRecord>? items,
    int? page,
    int? totalPages,
    bool? loadingMore,
    String? scope,
    int? due,
    int? paid,
    int? settled,
    String? error,
  }) {
    return AdminInvoicesState(
      status: status ?? this.status,
      items: items ?? this.items,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      loadingMore: loadingMore ?? this.loadingMore,
      scope: scope ?? this.scope,
      due: due ?? this.due,
      paid: paid ?? this.paid,
      settled: settled ?? this.settled,
      error: error,
    );
  }

  @override
  List<Object?> get props =>
      [status, items, page, totalPages, loadingMore, scope, due, paid, settled, error];
}

/// Admin invoices tab (SRD billing): metered bookings billed into invoices.
class AdminInvoicesCubit extends Cubit<AdminInvoicesState> {
  final BillingService _service;
  static const _limit = 20;
  String _search = '';

  AdminInvoicesCubit({BillingService? service})
      : _service = service ?? BillingService(),
        super(const AdminInvoicesState());

  Future<void> load({String? scope, String? search}) async {
    final nextScope = scope ?? state.scope;
    if (search != null) _search = search;
    emit(state.copyWith(status: ViewStatus.loading, scope: nextScope));
    try {
      final res = await _service.getInvoices(
        scope: nextScope,
        search: _search,
        page: 1,
        limit: _limit,
      );
      emit(state.copyWith(
        status: ViewStatus.success,
        items: res.invoices,
        page: res.currentPage,
        totalPages: res.totalPages,
        due: res.due,
        paid: res.paid,
        settled: res.settled,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    try {
      final res = await _service.getInvoices(
        scope: state.scope,
        search: _search,
        page: state.page + 1,
        limit: _limit,
      );
      emit(state.copyWith(
        items: [...state.items, ...res.invoices],
        page: res.currentPage,
        totalPages: res.totalPages,
        loadingMore: false,
      ));
    } catch (_) {
      emit(state.copyWith(loadingMore: false));
    }
  }

  Future<void> recordPayment(String id,
      {required String method, String? note}) async {
    await _service.recordInvoicePayment(id, method: method, note: note);
    await load();
  }

  Future<void> voidInvoice(String id, String? reason) async {
    await _service.voidInvoice(id, reason: reason);
    await load();
  }

  Future<void> resendReceipt(String id) async {
    await _service.resendReceipt(id);
  }
}
