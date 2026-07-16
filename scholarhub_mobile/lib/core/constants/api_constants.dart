/// Central place for backend endpoints. The base URL points at the deployed
/// Scholar Hub backend (Railway). Override [baseUrl] for local development.
class ApiConstants {
  ApiConstants._();

  static const String baseUrl =
      'https://backend-production-59ab.up.railway.app/api';

  // Razorpay test key (from the web frontend).
  static const String razorpayKeyId = 'rzp_test_RNsg28RlXtLY7i';

  // Auth
  static const String login = '/auth/login';
  static const String signup = '/auth/signin';
  static const String verifyToken = '/auth/verify-token';
  static String verifyOtp(String id) => '/auth/verify/$id';
  static String updateUser(String id) => '/auth/$id';
  static String fcmToken(String id) => '/auth/fcm-token/$id';

  // Reviews / ratings
  static const String review = '/review';
  static String mentorReviews(String mentorId) => '/review/mentor/$mentorId';

  // Refer & earn
  static String referral(String userId) => '/referral/$userId';

  // Ads / promotional banners
  static const String ads = '/ads';
  static const String adsAll = '/ads/all';
  static String adById(String id) => '/ads/$id';

  // Mentors
  static const String mentor = '/mentor';
  static String updateMentor(String id) => '/mentor/$id';
  static String mentorAvailability(String id) => '/mentor/$id/availability';

  // Catalog
  static const String classes = '/classes';
  static String classById(String id) => '/classes/$id';
  static String subjects(String type) => '/subject/$type';
  static String updateSubject(String id) => '/subject/$id';

  // Bookings
  static const String booking = '/booking';
  static String bookingsByStudent(String studentId) => '/booking/$studentId';
  static String updateBooking(String bookingId) => '/booking/$bookingId';

  // Manual payment collection (admin)
  static const String duePayments = '/booking/payments/due';
  static String approveBooking(String bookingId) =>
      '/booking/$bookingId/approve';
  static String rejectBooking(String bookingId) => '/booking/$bookingId/reject';
  static String recordPayment(String bookingId) =>
      '/booking/$bookingId/payments';

  // Booking session logs
  static String bookingLog(String bookingId) => '/bookingLog/$bookingId';

  // Inquiry / become-a-mentor lead
  static const String inquiry = '/inquery-form';
  static String inquiryById(String id) => '/inquery-form/$id';
}
