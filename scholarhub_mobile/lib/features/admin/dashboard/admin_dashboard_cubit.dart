import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/booking.dart';
import '../../../data/models/inquiry.dart';
import '../../../data/models/mentor.dart';
import '../../../data/services/booking_service.dart';
import '../../../data/services/inquiry_service.dart';
import '../../../data/services/mentor_service.dart';
import '../../../state/view_status.dart';

class AdminDashboardState extends Equatable {
  final ViewStatus status;
  final int pendingInquiries;
  final int totalInquiries;
  final int approvedMentors;
  final int pendingMentors;
  final int totalBookings;
  final List<Inquiry> recentPending;
  final String? error;

  const AdminDashboardState({
    this.status = ViewStatus.initial,
    this.pendingInquiries = 0,
    this.totalInquiries = 0,
    this.approvedMentors = 0,
    this.pendingMentors = 0,
    this.totalBookings = 0,
    this.recentPending = const [],
    this.error,
  });

  AdminDashboardState copyWith({
    ViewStatus? status,
    int? pendingInquiries,
    int? totalInquiries,
    int? approvedMentors,
    int? pendingMentors,
    int? totalBookings,
    List<Inquiry>? recentPending,
    String? error,
  }) {
    return AdminDashboardState(
      status: status ?? this.status,
      pendingInquiries: pendingInquiries ?? this.pendingInquiries,
      totalInquiries: totalInquiries ?? this.totalInquiries,
      approvedMentors: approvedMentors ?? this.approvedMentors,
      pendingMentors: pendingMentors ?? this.pendingMentors,
      totalBookings: totalBookings ?? this.totalBookings,
      recentPending: recentPending ?? this.recentPending,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
        status,
        pendingInquiries,
        totalInquiries,
        approvedMentors,
        pendingMentors,
        totalBookings,
        recentPending,
        error,
      ];
}

class AdminDashboardCubit extends Cubit<AdminDashboardState> {
  final InquiryService _inquiries;
  final MentorService _mentors;
  final BookingService _bookings;

  AdminDashboardCubit({
    InquiryService? inquiries,
    MentorService? mentors,
    BookingService? bookings,
  })  : _inquiries = inquiries ?? InquiryService(),
        _mentors = mentors ?? MentorService(),
        _bookings = bookings ?? BookingService(),
        super(const AdminDashboardState());

  Future<void> load(String adminId) async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      // The inquiry endpoint mixes all statuses and the mentor endpoint sends
      // no server-side total, so we fetch a generous page and count locally.
      // Bookings DO return a server total, so limit:1 is enough there.
      final results = await Future.wait([
        _inquiries.getInquiries(page: 1, limit: 1000),
        _mentors.getMentorsPage(type: 'approve', page: 1, limit: 1000),
        _mentors.getMentorsPage(page: 1, limit: 1000),
        _bookings.getBookings(adminId, page: 1, limit: 1),
      ]);

      final inquiries = results[0] as PaginatedInquiries;
      final approved = results[1] as PaginatedMentors;
      final pending = results[2] as PaginatedMentors;
      final bookings = results[3] as PaginatedBookings;

      final pendingList =
          inquiries.items.where((i) => i.isPending).toList(growable: false);

      emit(state.copyWith(
        status: ViewStatus.success,
        pendingInquiries: pendingList.length,
        totalInquiries: inquiries.total,
        approvedMentors: approved.items.length,
        pendingMentors: pending.items.length,
        totalBookings: bookings.total,
        recentPending: pendingList.take(5).toList(),
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }
}
