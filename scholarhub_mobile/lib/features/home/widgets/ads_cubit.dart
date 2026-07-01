import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/ad_banner.dart';
import '../../../data/services/ad_service.dart';
import '../../../state/view_status.dart';

class AdsState extends Equatable {
  final ViewStatus status;
  final List<AdBanner> ads;

  const AdsState({this.status = ViewStatus.initial, this.ads = const []});

  AdsState copyWith({ViewStatus? status, List<AdBanner>? ads}) {
    return AdsState(status: status ?? this.status, ads: ads ?? this.ads);
  }

  @override
  List<Object?> get props => [status, ads];
}

class AdsCubit extends Cubit<AdsState> {
  final AdService _service;

  AdsCubit({AdService? service})
      : _service = service ?? AdService(),
        super(const AdsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final ads = await _service.getActiveAds();
      emit(state.copyWith(status: ViewStatus.success, ads: ads));
    } catch (_) {
      // Banners are non-critical — fail quietly and just show nothing.
      emit(state.copyWith(status: ViewStatus.failure, ads: const []));
    }
  }
}
