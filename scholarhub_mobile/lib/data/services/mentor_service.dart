import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/mentor.dart';

class MentorService {
  final ApiClient _api = ApiClient.instance;

  /// Approved, publicly listable mentors.
  Future<List<Mentor>> getApprovedMentors() async {
    final res = await _api.get(
      ApiConstants.mentor,
      query: {'page': 1, 'limit': 100000, 'type': 'approve'},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load mentors.'));
    }
    final data = (res.data as Map)['data'];
    if (data is! List) return [];
    return data
        .whereType<Map>()
        .map((m) => Mentor.fromJson(m.cast<String, dynamic>()))
        // Hide mentors that have not finished onboarding (web filter).
        .where((m) => !m.isFirstLogin)
        .toList();
  }

  /// Paginated mentor listing for the admin dashboard. [type] = 'approve'
  /// returns approved mentors; omit it for pending (unapproved) applicants.
  Future<PaginatedMentors> getMentorsPage({
    String? type,
    int page = 1,
    int limit = 10,
  }) async {
    final res = await _api.get(
      ApiConstants.mentor,
      query: {
        'page': page,
        'limit': limit,
        'type': ?type,
      },
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load mentors.'));
    }
    final body = res.data;
    final data = body is Map ? body['data'] : null;
    final items = <Mentor>[];
    if (data is List) {
      for (final m in data) {
        if (m is Map) {
          items.add(Mentor.fromJson(m.cast<String, dynamic>()));
        }
      }
    }
    // The mentor list currently returns `{message, data}` with no pagination
    // metadata, so total falls back to the number of items returned. Parsing is
    // kept tolerant of a future top-level `total`/`totalPages` envelope.
    int asInt(dynamic v, int fallback) =>
        v is int ? v : (v is num ? v.toInt() : fallback);
    return PaginatedMentors(
      items: items,
      totalPages: asInt(body is Map ? body['totalPages'] : null, 1),
      currentPage: asInt(body is Map ? body['page'] : null, 1),
      total: asInt(body is Map ? body['total'] : null, items.length),
    );
  }

  /// Updates a mentor (admin approval, profile completion, etc.).
  Future<void> updateMentor(String id, Map<String, dynamic> data) async {
    final res = await _api.put(ApiConstants.updateMentor(id), data: data);
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update the mentor.'));
    }
  }

  Future<Mentor> getMentorById(String id) async {
    final res = await _api.get(ApiConstants.mentor, query: {'id': id});
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Mentor not found.'));
    }
    final data = (res.data as Map)['data'];
    if (data is! Map) {
      throw const ApiException('Mentor not found.');
    }
    return Mentor.fromJson(data.cast<String, dynamic>());
  }

  /// "Become a Mentor" lead form -> POST /mentor.
  Future<void> submitMentorApplication({
    required String name,
    required String email,
    required String phone,
    required String place,
    required String message,
  }) async {
    final res = await _api.post(
      ApiConstants.mentor,
      data: {
        'name': name,
        'firstName': name,
        'email': email,
        'phone': phone,
        'phoneNumber': phone,
        'place': place,
        'message': message,
      },
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(
          res, 'Unable to submit your application.'));
    }
  }
}
