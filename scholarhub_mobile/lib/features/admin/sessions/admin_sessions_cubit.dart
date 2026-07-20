import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/billing.dart';
import '../../../data/services/billing_service.dart';
import '../../../state/view_status.dart';

class AdminSessionsState extends Equatable {
  final ViewStatus status;
  final List<SessionRecord> sessions;
  final String filter; // logged | verified | rejected | all
  final int loggedCount;
  final String? error;

  const AdminSessionsState({
    this.status = ViewStatus.initial,
    this.sessions = const [],
    this.filter = 'logged',
    this.loggedCount = 0,
    this.error,
  });

  AdminSessionsState copyWith({
    ViewStatus? status,
    List<SessionRecord>? sessions,
    String? filter,
    int? loggedCount,
    String? error,
  }) {
    return AdminSessionsState(
      status: status ?? this.status,
      sessions: sessions ?? this.sessions,
      filter: filter ?? this.filter,
      loggedCount: loggedCount ?? this.loggedCount,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, sessions, filter, loggedCount, error];
}

/// Admin verification of mentor-logged sessions (SRD Sessions & Attendance).
class AdminSessionsCubit extends Cubit<AdminSessionsState> {
  final BillingService _service;

  AdminSessionsCubit({BillingService? service})
      : _service = service ?? BillingService(),
        super(const AdminSessionsState());

  Future<void> load({String? filter}) async {
    final nextFilter = filter ?? state.filter;
    emit(state.copyWith(status: ViewStatus.loading, filter: nextFilter));
    try {
      final page = await _service.getSessions(
        status: nextFilter == 'all' ? null : nextFilter,
        limit: 100,
      );
      emit(state.copyWith(
        status: ViewStatus.success,
        sessions: page.sessions,
        loggedCount: page.loggedCount,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> verify(String id) async {
    await _service.verifySession(id);
    await load();
  }

  Future<void> reject(String id, String? reason) async {
    await _service.rejectSession(id, reason: reason);
    await load();
  }
}
