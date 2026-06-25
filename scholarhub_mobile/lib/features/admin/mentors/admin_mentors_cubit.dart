import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/mentor.dart';
import '../../../data/services/mentor_service.dart';
import '../../../state/view_status.dart';

class AdminMentorsState extends Equatable {
  final ViewStatus status;
  final List<Mentor> pending;
  final List<Mentor> approved;
  final String? approvingId;
  final String? error;

  const AdminMentorsState({
    this.status = ViewStatus.initial,
    this.pending = const [],
    this.approved = const [],
    this.approvingId,
    this.error,
  });

  AdminMentorsState copyWith({
    ViewStatus? status,
    List<Mentor>? pending,
    List<Mentor>? approved,
    String? approvingId,
    bool clearApproving = false,
    String? error,
  }) {
    return AdminMentorsState(
      status: status ?? this.status,
      pending: pending ?? this.pending,
      approved: approved ?? this.approved,
      approvingId: clearApproving ? null : (approvingId ?? this.approvingId),
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, pending, approved, approvingId, error];
}

class AdminMentorsCubit extends Cubit<AdminMentorsState> {
  final MentorService _service;

  AdminMentorsCubit({MentorService? service})
      : _service = service ?? MentorService(),
        super(const AdminMentorsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final results = await Future.wait([
        _service.getMentorsPage(page: 1, limit: 100),
        _service.getMentorsPage(type: 'approve', page: 1, limit: 100),
      ]);
      emit(state.copyWith(
        status: ViewStatus.success,
        pending: results[0].items,
        approved: results[1].items,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  /// Promotes a pending applicant to an approved mentor.
  Future<void> approve(String id) async {
    emit(state.copyWith(approvingId: id));
    try {
      await _service.updateMentor(id, {'admin_approve': true});
      await load();
    } finally {
      emit(state.copyWith(clearApproving: true));
    }
  }
}
