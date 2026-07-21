import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/di/service_locator.dart';
import '../../../data/models/enquiry.dart';
import '../../../data/services/enquiry_service.dart';
import '../../../state/view_status.dart';

class AdminEnquiriesState extends Equatable {
  final ViewStatus status;
  final List<EnquiryRecord> items;
  final int page;
  final int totalPages;
  final bool loadingMore;
  final String scope; // new | contacted | converted | closed | all
  final int newCount;
  final int contacted;
  final int converted;
  final int closed;
  final String? error;

  const AdminEnquiriesState({
    this.status = ViewStatus.initial,
    this.items = const [],
    this.page = 1,
    this.totalPages = 1,
    this.loadingMore = false,
    this.scope = 'new',
    this.newCount = 0,
    this.contacted = 0,
    this.converted = 0,
    this.closed = 0,
    this.error,
  });

  bool get hasMore => page < totalPages;

  AdminEnquiriesState copyWith({
    ViewStatus? status,
    List<EnquiryRecord>? items,
    int? page,
    int? totalPages,
    bool? loadingMore,
    String? scope,
    int? newCount,
    int? contacted,
    int? converted,
    int? closed,
    String? error,
  }) {
    return AdminEnquiriesState(
      status: status ?? this.status,
      items: items ?? this.items,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      loadingMore: loadingMore ?? this.loadingMore,
      scope: scope ?? this.scope,
      newCount: newCount ?? this.newCount,
      contacted: contacted ?? this.contacted,
      converted: converted ?? this.converted,
      closed: closed ?? this.closed,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
        status,
        items,
        page,
        totalPages,
        loadingMore,
        scope,
        newCount,
        contacted,
        converted,
        closed,
        error,
      ];
}

class AdminEnquiriesCubit extends Cubit<AdminEnquiriesState> {
  final EnquiryService _service;
  static const _limit = 20;

  AdminEnquiriesCubit({EnquiryService? service})
      : _service = service ?? sl<EnquiryService>(),
        super(const AdminEnquiriesState());

  Future<void> load({String? scope}) async {
    final nextScope = scope ?? state.scope;
    emit(state.copyWith(status: ViewStatus.loading, scope: nextScope));
    try {
      final res = await _service.getEnquiries(
        scope: nextScope,
        page: 1,
        limit: _limit,
      );
      emit(state.copyWith(
        status: ViewStatus.success,
        items: res.enquiries,
        page: res.currentPage,
        totalPages: res.totalPages,
        newCount: res.newCount,
        contacted: res.contacted,
        converted: res.converted,
        closed: res.closed,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    emit(state.copyWith(loadingMore: true));
    try {
      final res = await _service.getEnquiries(
        scope: state.scope,
        page: state.page + 1,
        limit: _limit,
      );
      emit(state.copyWith(
        items: [...state.items, ...res.enquiries],
        page: res.currentPage,
        totalPages: res.totalPages,
        loadingMore: false,
      ));
    } catch (_) {
      emit(state.copyWith(loadingMore: false));
    }
  }

  /// Update an enquiry's status (e.g. mark contacted / close), then reload.
  Future<void> updateStatus(String id, String status) async {
    await _service.updateStatus(id, status);
    await load();
  }

  /// Create a confirmed flat-fee booking from an enquiry, then reload so the
  /// converted lead moves out of the current scope.
  Future<void> createBooking({
    required EnquiryRecord enquiry,
    required num totalAmount,
    required String paymentFrequency,
    required String classStartDate,
  }) async {
    await _service.createBooking(
      enquiryId: enquiry.id,
      studentName: enquiry.studentName,
      email: enquiry.email,
      phone: enquiry.phone,
      mentorId: enquiry.mentorId,
      classId: enquiry.classId,
      className: enquiry.className,
      selectedSyllabus: enquiry.selectedSyllabus,
      subjects: enquiry.subjects,
      bookingType: enquiry.enquiryType.apiValue,
      totalAmount: totalAmount,
      paymentFrequency: paymentFrequency,
      classStartDate: classStartDate,
    );
    await load();
  }
}
