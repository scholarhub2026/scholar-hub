import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/booking.dart';
import '../models/booking_draft.dart';

class BookingService {
  final ApiClient _api = ApiClient.instance;

  /// Creates a booking. Returns the new booking id (empty if not present).
  Future<String> createBooking(
    BookingDraft draft, {
    required String studentId,
  }) async {
    final res = await _api.post(
      ApiConstants.booking,
      data: draft.toPayload(studentId: studentId),
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to create your booking.'));
    }
    final body = res.data;
    if (body is Map && body['newBooking'] is Map) {
      return (body['newBooking']['_id'] ?? '').toString();
    }
    return '';
  }

  Future<PaginatedBookings> getStudentBookings(
    String studentId, {
    int page = 1,
    int limit = 50,
  }) =>
      getBookings(studentId, page: page, limit: limit);

  /// Fetches bookings for [userId]. The backend filters by the caller's role:
  /// students see their own, mentors see their confirmed sessions, admins see
  /// everything. [search] matches student/mentor name or email.
  Future<PaginatedBookings> getBookings(
    String userId, {
    int page = 1,
    int limit = 50,
    String search = '',
  }) async {
    final res = await _api.get(
      ApiConstants.bookingsByStudent(userId),
      query: {'page': page, 'limit': limit, 'search': search},
    );
    // 202 = "No bookings found" (empty), 200 = data.
    final body = res.data;
    final rawBookings = (body is Map ? body['bookings'] : null);
    final bookings = <Booking>[];
    if (rawBookings is List) {
      for (final b in rawBookings) {
        if (b is Map) {
          bookings.add(Booking.fromJson(b.cast<String, dynamic>()));
        }
      }
    }
    final pagination = (body is Map ? body['pagination'] : null);
    return PaginatedBookings(
      bookings: bookings,
      totalPages: (pagination is Map ? pagination['totalPages'] : 1) as int? ?? 1,
      currentPage:
          (pagination is Map ? pagination['currentPage'] : 1) as int? ?? 1,
      total: (pagination is Map ? pagination['totalRecords'] : bookings.length)
              as int? ??
          bookings.length,
    );
  }

  /// Admin booking update (payment/booking status, remarks, amount).
  Future<void> updateBooking(
    String bookingId,
    Map<String, dynamic> data,
  ) async {
    final res = await _api.put(
      ApiConstants.updateBooking(bookingId),
      data: data,
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update the booking.'));
    }
  }

  /// Admin: approve a pending booking (starts its payment schedule and
  /// notifies the student + mentor).
  Future<void> approveBooking(String bookingId) async {
    final res =
        await _api.patch(ApiConstants.approveBooking(bookingId), data: {});
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to approve the booking.'));
    }
  }

  /// Admin: reject a pending booking with an optional reason.
  Future<void> rejectBooking(String bookingId, {String? reason}) async {
    final res = await _api.patch(
      ApiConstants.rejectBooking(bookingId),
      data: {'reason': ?reason},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to reject the booking.'));
    }
  }

  /// Admin: record a manually collected payment. [amount] defaults to the
  /// booking's fee server-side; advances the next due date by one period.
  Future<void> recordPayment(
    String bookingId, {
    num? amount,
    String? note,
  }) async {
    final res = await _api.post(
      ApiConstants.recordPayment(bookingId),
      data: {'amount': ?amount, 'note': ?note},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to record the payment.'));
    }
  }

  /// Admin: bookings by next due date for the Payments tab.
  /// [scope] = all | overdue | today | upcoming.
  Future<DuePayments> getDuePayments({
    String scope = 'all',
    int page = 1,
    int limit = 20,
    String search = '',
  }) async {
    final res = await _api.get(
      ApiConstants.duePayments,
      query: {'scope': scope, 'page': page, 'limit': limit, 'search': search},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load due payments.'));
    }
    final body = res.data;
    final rawBookings = (body is Map ? body['bookings'] : null);
    final bookings = <Booking>[];
    if (rawBookings is List) {
      for (final b in rawBookings) {
        if (b is Map) {
          bookings.add(Booking.fromJson(b.cast<String, dynamic>()));
        }
      }
    }
    final counts = (body is Map ? body['counts'] : null);
    int countOf(String key) =>
        (counts is Map && counts[key] is num) ? (counts[key] as num).toInt() : 0;
    final pagination = (body is Map ? body['pagination'] : null);
    return DuePayments(
      bookings: bookings,
      overdue: countOf('overdue'),
      dueToday: countOf('today'),
      upcoming: countOf('upcoming'),
      totalPages:
          (pagination is Map ? pagination['totalPages'] : 1) as int? ?? 1,
      currentPage:
          (pagination is Map ? pagination['currentPage'] : 1) as int? ?? 1,
    );
  }
}

/// Result of `GET /booking/payments/due` — bookings + scope tab counts.
class DuePayments {
  final List<Booking> bookings;
  final int overdue;
  final int dueToday;
  final int upcoming;
  final int totalPages;
  final int currentPage;

  const DuePayments({
    required this.bookings,
    required this.overdue,
    required this.dueToday,
    required this.upcoming,
    required this.totalPages,
    required this.currentPage,
  });
}
