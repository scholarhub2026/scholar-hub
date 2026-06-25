import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/inquiry.dart';
import '../../../data/services/inquiry_service.dart';
import '../../../state/paged_state.dart';
import '../../../state/view_status.dart';

class InquiriesCubit extends Cubit<PagedState<Inquiry>> {
  final InquiryService _service;
  static const _limit = 20;

  InquiriesCubit({InquiryService? service})
      : _service = service ?? InquiryService(),
        super(const PagedState<Inquiry>());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final res = await _service.getInquiries(page: 1, limit: _limit);
      emit(state.copyWith(
        status: ViewStatus.success,
        items: res.items,
        page: res.currentPage,
        totalPages: res.totalPages,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    try {
      final next = state.page + 1;
      final res = await _service.getInquiries(page: next, limit: _limit);
      emit(state.copyWith(
        items: [...state.items, ...res.items],
        page: res.currentPage,
        totalPages: res.totalPages,
        loadingMore: false,
      ));
    } catch (_) {
      emit(state.copyWith(loadingMore: false));
    }
  }

  Future<void> updateStatus(String id, String status) async {
    await _service.updateStatus(id, status);
    await load();
  }
}
