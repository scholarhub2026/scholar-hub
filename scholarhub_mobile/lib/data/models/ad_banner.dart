/// A promotional banner shown in the home carousel. Managed by admins via the
/// `/ads` endpoints.
class AdBanner {
  final String id;
  final String title;
  final String imageUrl;
  final String linkUrl;

  const AdBanner({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.linkUrl,
  });

  bool get hasLink => linkUrl.isNotEmpty;

  factory AdBanner.fromJson(Map<String, dynamic> json) {
    return AdBanner(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      linkUrl: (json['linkUrl'] ?? '').toString(),
    );
  }
}
