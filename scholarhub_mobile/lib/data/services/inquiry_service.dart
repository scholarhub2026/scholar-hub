import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/inquiry.dart';

class InquiryService {
  final ApiClient _api = ApiClient.instance;

  /// Paginated enquiry list for the admin dashboard.
  Future<PaginatedInquiries> getInquiries({int page = 1, int limit = 50}) async {
    final res = await _api.get(
      ApiConstants.inquiry,
      query: {'page': page, 'limit': limit},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load enquiries.'));
    }
    final body = res.data;
    final data = body is Map ? body['data'] : null;
    final items = <Inquiry>[];
    if (data is List) {
      for (final i in data) {
        if (i is Map) {
          items.add(Inquiry.fromJson(i.cast<String, dynamic>()));
        }
      }
    }
    // `/inquery-form` spreads the paginate() result at the TOP LEVEL
    // ({data, page, limit, total, totalPages}), not under a `pagination` key.
    int asInt(dynamic v, int fallback) =>
        v is int ? v : (v is num ? v.toInt() : fallback);
    return PaginatedInquiries(
      items: items,
      totalPages: asInt(body is Map ? body['totalPages'] : null, 1),
      currentPage: asInt(body is Map ? body['page'] : null, 1),
      total: asInt(body is Map ? body['total'] : null, items.length),
    );
  }

  /// Updates an enquiry's status (PENDING / IN_PROGRESS / COMPLETED / CANCELLED).
  Future<void> updateStatus(String id, String status) async {
    final res = await _api.put(
      ApiConstants.inquiryById(id),
      data: {'status': status},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update the enquiry.'));
    }
  }

  /// "Enquiry Now" lead form -> POST /inquery-form.
  Future<void> submitInquiry({
    required String name,
    required String email,
    required String phoneNumber,
    required String place,
    required String subject,
    required String message,
  }) async {
    final res = await _api.post(
      ApiConstants.inquiry,
      data: {
        'name': name,
        'email': email,
        'phoneNumber': phoneNumber,
        'place': place,
        'subject': subject,
        'message': message,
      },
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to submit your enquiry.'));
    }
  }
}
