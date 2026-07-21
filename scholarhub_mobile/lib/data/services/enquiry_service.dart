import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/enquiry.dart';

/// Class enquiries: the student lead form + the admin inbox + admin
/// booking-creation from an enquiry.
class EnquiryService {
  final ApiClient _api = ApiClient.instance;

  /// Public — a student enquires about a mentor's classes (no booking/payment).
  Future<void> submitEnquiry({
    required String studentName,
    required String email,
    required String phone,
    required String mentorId,
    required EnquiryType enquiryType,
    String? selectedSyllabus,
    String? classId,
    String? className,
    List<EnquirySubject> subjects = const [],
    String? message,
  }) async {
    final res = await _api.post(ApiConstants.enquiry, data: {
      'studentName': studentName,
      'email': email,
      'phone': phone,
      'mentorId': mentorId,
      'enquiryType': enquiryType.apiValue,
      'selectedSyllabus': ?selectedSyllabus,
      'classId': ?classId,
      'className': ?className,
      'subjects': subjects.map((s) => s.toJson()).toList(),
      'message': ?message,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to send your enquiry.'));
    }
  }

  /// Admin — list enquiries. [scope] = all | new | contacted | converted | closed.
  Future<EnquiriesPage> getEnquiries({
    String scope = 'all',
    String search = '',
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _api.get(ApiConstants.enquiry, query: {
      'scope': scope,
      'search': search,
      'page': page,
      'limit': limit,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load enquiries.'));
    }
    final body = res.data;
    final raw = (body is Map ? body['enquiries'] : null);
    final enquiries = <EnquiryRecord>[];
    if (raw is List) {
      for (final e in raw) {
        if (e is Map) {
          enquiries.add(EnquiryRecord.fromJson(e.cast<String, dynamic>()));
        }
      }
    }
    final counts = (body is Map ? body['counts'] : null);
    int countOf(String k) =>
        (counts is Map && counts[k] is num) ? (counts[k] as num).toInt() : 0;
    final pagination = (body is Map ? body['pagination'] : null);
    return EnquiriesPage(
      enquiries: enquiries,
      newCount: countOf('new'),
      contacted: countOf('contacted'),
      converted: countOf('converted'),
      closed: countOf('closed'),
      totalPages:
          (pagination is Map ? pagination['totalPages'] : 1) as int? ?? 1,
      currentPage:
          (pagination is Map ? pagination['currentPage'] : 1) as int? ?? 1,
    );
  }

  /// Admin — update an enquiry's status.
  Future<void> updateStatus(String id, String status) async {
    final res =
        await _api.patch(ApiConstants.enquiryById(id), data: {'status': status});
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update the enquiry.'));
    }
  }

  /// Admin — create a confirmed flat-fee booking (typically from an enquiry).
  Future<void> createBooking({
    String? enquiryId,
    required String studentName,
    required String email,
    required String phone,
    required String mentorId,
    String? classId,
    String? className,
    String? selectedSyllabus,
    List<EnquirySubject> subjects = const [],
    required String bookingType,
    required num totalAmount,
    required String paymentFrequency, // weekly | monthly
    required String classStartDate, // YYYY-MM-DD
  }) async {
    final res = await _api.post(ApiConstants.adminCreateBooking, data: {
      'enquiryId': ?enquiryId,
      'studentName': studentName,
      'email': email,
      'phone': phone,
      'mentorId': mentorId,
      'classId': ?classId,
      'className': ?className,
      'selectedSyllabus': ?selectedSyllabus,
      'subjects': subjects.map((s) => s.toJson()).toList(),
      'bookingType': bookingType,
      'totalAmount': totalAmount,
      'paymentFrequency': paymentFrequency,
      'classStartDate': classStartDate,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to create the booking.'));
    }
  }
}

class EnquiriesPage {
  final List<EnquiryRecord> enquiries;
  final int newCount;
  final int contacted;
  final int converted;
  final int closed;
  final int totalPages;
  final int currentPage;
  const EnquiriesPage({
    required this.enquiries,
    required this.newCount,
    required this.contacted,
    required this.converted,
    required this.closed,
    required this.totalPages,
    required this.currentPage,
  });
}
