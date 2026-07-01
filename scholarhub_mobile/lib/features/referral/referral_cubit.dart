import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/referral.dart';
import '../../data/services/referral_service.dart';
import '../../state/view_status.dart';

class ReferralState extends Equatable {
  final ViewStatus status;
  final ReferralInfo? info;
  final String? error;

  const ReferralState({
    this.status = ViewStatus.initial,
    this.info,
    this.error,
  });

  ReferralState copyWith({
    ViewStatus? status,
    ReferralInfo? info,
    String? error,
  }) {
    return ReferralState(
      status: status ?? this.status,
      info: info ?? this.info,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, info, error];
}

class ReferralCubit extends Cubit<ReferralState> {
  final ReferralService _service;

  ReferralCubit({ReferralService? service})
      : _service = service ?? ReferralService(),
        super(const ReferralState());

  Future<void> load(String userId) async {
    if (userId.isEmpty) {
      emit(state.copyWith(
        status: ViewStatus.failure,
        error: 'You need to be signed in to refer friends.',
      ));
      return;
    }
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final info = await _service.getReferral(userId);
      emit(state.copyWith(status: ViewStatus.success, info: info));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }
}
