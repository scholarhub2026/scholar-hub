import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/referral.dart';

class ReferralService {
  final ApiClient _api = ApiClient.instance;

  /// The current user's referral code, reward balance, and referred users.
  Future<ReferralInfo> getReferral(String userId) async {
    final res = await _api.get(ApiConstants.referral(userId));
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load your referral details.'));
    }
    final data = res.data is Map ? (res.data as Map)['data'] : null;
    if (data is! Map) {
      throw const ApiException('Unable to load your referral details.');
    }
    return ReferralInfo.fromJson(data.cast<String, dynamic>());
  }
}
