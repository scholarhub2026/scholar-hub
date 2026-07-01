/// A single rating left by a student/parent for a mentor.
class Review {
  final String id;
  final String studentName;
  final int rating;
  final String comment;
  final DateTime? createdAt;

  const Review({
    required this.id,
    required this.studentName,
    required this.rating,
    required this.comment,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    final ratingRaw = json['rating'];
    final rating = ratingRaw is num
        ? ratingRaw.round()
        : int.tryParse('$ratingRaw') ?? 0;
    return Review(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      studentName: (json['studentName'] ?? 'Anonymous').toString(),
      rating: rating.clamp(0, 5),
      comment: (json['comment'] ?? '').toString(),
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()),
    );
  }
}

/// A mentor's reviews plus the aggregate average and total count.
class MentorReviews {
  final List<Review> reviews;
  final double average;
  final int count;

  const MentorReviews({
    required this.reviews,
    required this.average,
    required this.count,
  });

  factory MentorReviews.fromJson(Map<String, dynamic> json) {
    final list = json['data'];
    final reviews = <Review>[];
    if (list is List) {
      for (final r in list) {
        if (r is Map) reviews.add(Review.fromJson(r.cast<String, dynamic>()));
      }
    }
    final avgRaw = json['average'];
    final countRaw = json['count'];
    return MentorReviews(
      reviews: reviews,
      average: avgRaw is num ? avgRaw.toDouble() : 0,
      count: countRaw is num ? countRaw.toInt() : reviews.length,
    );
  }
}
