import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/billing.dart';
import '../../../data/services/billing_service.dart';
import '../../../state/view_status.dart';

class AdminSettlementsState extends Equatable {
  final ViewStatus status;
  final List<SettlementRecord> settlements;
  final List<MentorPending> pendingByMentor;
  final String? error;

  const AdminSettlementsState({
    this.status = ViewStatus.initial,
    this.settlements = const [],
    this.pendingByMentor = const [],
    this.error,
  });

  AdminSettlementsState copyWith({
    ViewStatus? status,
    List<SettlementRecord>? settlements,
    List<MentorPending>? pendingByMentor,
    String? error,
  }) {
    return AdminSettlementsState(
      status: status ?? this.status,
      settlements: settlements ?? this.settlements,
      pendingByMentor: pendingByMentor ?? this.pendingByMentor,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, settlements, pendingByMentor, error];
}

/// Admin payouts: what is owed to mentors (paid-but-unsettled invoices) and the
/// payout history (SRD Settlements).
class AdminSettlementsCubit extends Cubit<AdminSettlementsState> {
  final BillingService _service;

  AdminSettlementsCubit({BillingService? service})
      : _service = service ?? BillingService(),
        super(const AdminSettlementsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final page = await _service.getSettlements(limit: 100);
      emit(state.copyWith(
        status: ViewStatus.success,
        settlements: page.settlements,
        pendingByMentor: page.pendingByMentor,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> createSettlement({
    required String mentorId,
    required List<String> invoiceIds,
    num? amount,
    required String method,
    String? reference,
    String? note,
  }) async {
    await _service.createSettlement(
      mentorId: mentorId,
      invoiceIds: invoiceIds,
      amount: amount,
      method: method,
      reference: reference,
      note: note,
    );
    await load();
  }

  Future<void> voidSettlement(String id, String? reason) async {
    await _service.voidSettlement(id, reason: reason);
    await load();
  }
}
