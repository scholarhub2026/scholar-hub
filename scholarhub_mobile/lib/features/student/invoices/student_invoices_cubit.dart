import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/billing.dart';
import '../../../data/services/billing_service.dart';
import '../../../state/view_status.dart';

class StudentInvoicesState extends Equatable {
  final ViewStatus status;
  final List<InvoiceRecord> invoices;
  final String? error;

  const StudentInvoicesState({
    this.status = ViewStatus.initial,
    this.invoices = const [],
    this.error,
  });

  StudentInvoicesState copyWith({
    ViewStatus? status,
    List<InvoiceRecord>? invoices,
    String? error,
  }) {
    return StudentInvoicesState(
      status: status ?? this.status,
      invoices: invoices ?? this.invoices,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, invoices, error];
}

/// A student's own invoices (SRD billing).
class StudentInvoicesCubit extends Cubit<StudentInvoicesState> {
  final BillingService _service;

  StudentInvoicesCubit({BillingService? service})
      : _service = service ?? BillingService(),
        super(const StudentInvoicesState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final invoices = await _service.myInvoices();
      emit(state.copyWith(status: ViewStatus.success, invoices: invoices));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }
}
