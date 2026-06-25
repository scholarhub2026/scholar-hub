import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/catalog.dart';

class CatalogService {
  final ApiClient _api = ApiClient.instance;

  Future<List<ClassItem>> getClasses() async {
    final res = await _api.get(
      ApiConstants.classes,
      query: {'page': 1, 'limit': 1000},
    );
    if (!ApiClient.isOk(res)) return [];
    final data = (res.data as Map)['data'];
    if (data is! List) return [];
    return data
        .whereType<Map>()
        .map((c) => ClassItem.fromJson(c.cast<String, dynamic>()))
        .toList();
  }

  Future<List<SubjectCatalogItem>> getSubjects({String type = 'subject'}) async {
    final res = await _api.get(
      ApiConstants.subjects(type),
      query: {'page': 1, 'limit': 1000},
    );
    if (!ApiClient.isOk(res)) return [];
    final body = res.data;
    final data = body is Map ? body['data'] : body;
    if (data is! List) return [];
    return data
        .whereType<Map>()
        .map((s) => SubjectCatalogItem.fromJson(s.cast<String, dynamic>()))
        .toList();
  }

  // --- Class management (admin) ---

  Future<void> createClass(Map<String, dynamic> payload) async {
    final res = await _api.post(ApiConstants.classes, data: payload);
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to create the class.'));
    }
  }

  Future<void> updateClass(String id, Map<String, dynamic> payload) async {
    final res = await _api.put(ApiConstants.classById(id), data: payload);
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update the class.'));
    }
  }

  Future<void> deleteClass(String id) async {
    final res = await _api.delete(ApiConstants.classById(id));
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to delete the class.'));
    }
  }

  // --- Subject management (admin) ---

  Future<void> createSubject(String name, {String type = 'subject'}) async {
    final res = await _api.post(
      ApiConstants.subjects(type),
      data: {'name': name},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to create the subject.'));
    }
  }

  Future<void> updateSubject(
    String id, {
    required String name,
    bool? isActive,
  }) async {
    final res = await _api.put(
      ApiConstants.updateSubject(id),
      data: {'name': name, 'isActive': ?isActive},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to update the subject.'));
    }
  }
}
