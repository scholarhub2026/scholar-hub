import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/billing.dart';
import '../../../data/services/billing_service.dart';
import '../../../state/view_status.dart';

class MentorEarningsState extends Equatable {
  final ViewStatus status;
  final List<InvoiceRecord> invoices;
  final List<SettlementRecord> payouts;
  final num billed;
  final num collected;
  final num paidOut;
  final String? error;

  const MentorEarningsState({
    this.status = ViewStatus.initial,
    this.invoices = const [],
    this.payouts = const [],
    this.billed = 0,
    this.collected = 0,
    this.paidOut = 0,
    this.error,
  });

  MentorEarningsState copyWith({
    ViewStatus? status,
    List<InvoiceRecord>? invoices,
    List<SettlementRecord>? payouts,
    num? billed,
    num? collected,
    num? paidOut,
    String? error,
  }) {
    return MentorEarningsState(
      status: status ?? this.status,
      invoices: invoices ?? this.invoices,
      payouts: payouts ?? this.payouts,
      billed: billed ?? this.billed,
      collected: collected ?? this.collected,
      paidOut: paidOut ?? this.paidOut,
      error: error,
    );
  }

  @override
  List<Object?> get props =>
      [status, invoices, payouts, billed, collected, paidOut, error];
}

/// Mentor earnings from the billing engine: invoices raised for their bookings
/// plus payouts (settlements) received.
class MentorEarningsCubit extends Cubit<MentorEarningsState> {
  final BillingService _service;

  MentorEarningsCubit({BillingService? service})
      : _service = service ?? BillingService(),
        super(const MentorEarningsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final invoices = await _service.mentorInvoices();
      final payouts = await _service.mentorSettlements();
      emit(state.copyWith(
        status: ViewStatus.success,
        invoices: invoices.invoices,
        payouts: payouts.settlements,
        billed: invoices.billed,
        collected: invoices.collected,
        paidOut: payouts.totalReceived,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }
}
