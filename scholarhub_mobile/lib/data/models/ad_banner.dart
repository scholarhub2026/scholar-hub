/// A promotional banner shown in the home carousel. Managed by admins via the
/// `/ads` endpoints.
class AdBanner {
  final String id;
  final String title;
  final String imageUrl;
  final String linkUrl;
  final bool isActive;
  final int order;

  const AdBanner({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.linkUrl,
    this.isActive = true,
    this.order = 0,
  });

  bool get hasLink => linkUrl.isNotEmpty;

  factory AdBanner.fromJson(Map<String, dynamic> json) {
    final orderRaw = json['order'];
    return AdBanner(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      linkUrl: (json['linkUrl'] ?? '').toString(),
      isActive: json['isActive'] != false,
      order: orderRaw is num ? orderRaw.toInt() : int.tryParse('$orderRaw') ?? 0,
    );
  }
}
