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

  /// Generates a Razorpay payment link; returns its short URL (or null).
  Future<String?> createPaymentLink({
    required num amount,
    required String name,
    required String email,
    required String contact,
    String? orderId,
  }) async {
    final res = await _api.post(
      ApiConstants.createPaymentLink,
      data: {
        'amount': amount,
        'name': name,
        'email': email,
        'contact': contact,
        'orderId': ?orderId,
      },
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to start payment.'));
    }
    final body = res.data;
    if (body is Map && body['paymentLink'] is Map) {
      return body['paymentLink']['short_url']?.toString();
    }
    return null;
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
}
