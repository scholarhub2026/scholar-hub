import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/ad_banner.dart';

class AdService {
  final ApiClient _api = ApiClient.instance;

  /// Active promotional banners for the home carousel, ordered by the admin.
  Future<List<AdBanner>> getActiveAds() async {
    final res = await _api.get(ApiConstants.ads);
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load banners.'));
    }
    return _parseList(res.data).where((a) => a.imageUrl.isNotEmpty).toList();
  }

  /// Every banner (admin) including inactive ones.
  Future<List<AdBanner>> getAllAds() async {
    final res = await _api.get(ApiConstants.adsAll);
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load banners.'));
    }
    return _parseList(res.data);
  }

  Future<void> createAd({
    required String title,
    required String imageUrl,
    String linkUrl = '',
    bool isActive = true,
    int order = 0,
  }) async {
    final res = await _api.post(
      ApiConstants.ads,
      data: {
        'title': title,
        'imageUrl': imageUrl,
        'linkUrl': linkUrl,
        'isActive': isActive,
        'order': order,
      },
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to create the banner.'));
    }
  }

  Future<void> updateAd(String id, Map<String, dynamic> data) async {
    final res = await _api.put(ApiConstants.adById(id), data: data);
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to update the banner.'));
    }
  }

  Future<void> deleteAd(String id) async {
    final res = await _api.delete(ApiConstants.adById(id));
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to delete the banner.'));
    }
  }

  List<AdBanner> _parseList(dynamic body) {
    final data = body is Map ? body['data'] : null;
    if (data is! List) return [];
    return data
        .whereType<Map>()
        .map((m) => AdBanner.fromJson(m.cast<String, dynamic>()))
        .toList();
  }
}
