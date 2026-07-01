import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/ad_banner.dart';
import '../../../data/services/ad_service.dart';
import '../../../state/view_status.dart';

class AdminAdsState extends Equatable {
  final ViewStatus status;
  final List<AdBanner> items;
  final String? error;

  const AdminAdsState({
    this.status = ViewStatus.initial,
    this.items = const [],
    this.error,
  });

  AdminAdsState copyWith({
    ViewStatus? status,
    List<AdBanner>? items,
    String? error,
  }) {
    return AdminAdsState(
      status: status ?? this.status,
      items: items ?? this.items,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, items, error];
}

class AdminAdsCubit extends Cubit<AdminAdsState> {
  final AdService _service;

  AdminAdsCubit({AdService? service})
      : _service = service ?? AdService(),
        super(const AdminAdsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final items = await _service.getAllAds();
      emit(state.copyWith(status: ViewStatus.success, items: items));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> create({
    required String title,
    required String imageUrl,
    String linkUrl = '',
    bool isActive = true,
    int order = 0,
  }) async {
    await _service.createAd(
      title: title,
      imageUrl: imageUrl,
      linkUrl: linkUrl,
      isActive: isActive,
      order: order,
    );
    await load();
  }

  Future<void> update(String id, Map<String, dynamic> data) async {
    await _service.updateAd(id, data);
    await load();
  }

  /// Optimistic-free toggle: flip active state then reload.
  Future<void> toggleActive(AdBanner ad) async {
    await _service.updateAd(ad.id, {'isActive': !ad.isActive});
    await load();
  }

  Future<void> delete(String id) async {
    await _service.deleteAd(id);
    await load();
  }
}
