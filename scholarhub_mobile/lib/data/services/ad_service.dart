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
    final data = res.data is Map ? (res.data as Map)['data'] : null;
    if (data is! List) return [];
    return data
        .whereType<Map>()
        .map((m) => AdBanner.fromJson(m.cast<String, dynamic>()))
        .where((a) => a.imageUrl.isNotEmpty)
        .toList();
  }
}
