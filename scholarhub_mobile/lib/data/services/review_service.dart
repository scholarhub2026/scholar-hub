import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/review.dart';

class ReviewService {
  final ApiClient _api = ApiClient.instance;

  /// A mentor's reviews with the aggregate average + count.
  Future<MentorReviews> getMentorReviews(String mentorId) async {
    final res = await _api.get(ApiConstants.mentorReviews(mentorId));
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load reviews.'));
    }
    final body = res.data;
    if (body is! Map) {
      return const MentorReviews(reviews: [], average: 0, count: 0);
    }
    return MentorReviews.fromJson(body.cast<String, dynamic>());
  }

  /// Submit (or update) the current student's rating for a mentor. The backend
  /// rejects students who haven't booked the mentor — that message surfaces via
  /// the thrown [ApiException].
  Future<void> submitReview({
    required String studentId,
    required String mentorId,
    required int rating,
    String comment = '',
  }) async {
    final res = await _api.post(
      ApiConstants.review,
      data: {
        'studentId': studentId,
        'mentorId': mentorId,
        'rating': rating,
        'comment': comment,
      },
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to submit your review.'));
    }
  }
}
