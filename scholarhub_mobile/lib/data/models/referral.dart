/// A person who signed up using the current user's referral code.
class ReferredUser {
  final String name;
  final String email;
  final DateTime? joinedAt;

  const ReferredUser({
    required this.name,
    required this.email,
    required this.joinedAt,
  });

  factory ReferredUser.fromJson(Map<String, dynamic> json) {
    final first = (json['firstName'] ?? '').toString();
    final last = (json['lastName'] ?? '').toString();
    return ReferredUser(
      name: '$first $last'.trim(),
      email: (json['email'] ?? '').toString(),
      joinedAt: DateTime.tryParse((json['createdAt'] ?? '').toString()),
    );
  }
}

/// The current user's refer-and-earn summary from `/referral/:id`.
class ReferralInfo {
  final String code;
  final int count;
  final num rewardBalance;
  final List<ReferredUser> referredUsers;

  const ReferralInfo({
    required this.code,
    required this.count,
    required this.rewardBalance,
    required this.referredUsers,
  });

  factory ReferralInfo.fromJson(Map<String, dynamic> json) {
    final users = <ReferredUser>[];
    final raw = json['referredUsers'];
    if (raw is List) {
      for (final u in raw) {
        if (u is Map) users.add(ReferredUser.fromJson(u.cast<String, dynamic>()));
      }
    }
    final countRaw = json['referralCount'];
    final rewardRaw = json['rewardBalance'];
    return ReferralInfo(
      code: (json['referralCode'] ?? '').toString(),
      count: countRaw is num ? countRaw.toInt() : users.length,
      rewardBalance: rewardRaw is num ? rewardRaw : 0,
      referredUsers: users,
    );
  }
}
