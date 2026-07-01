import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/review.dart';
import '../../../data/services/review_service.dart';
import '../../../state/view_status.dart';

// --- List of a mentor's reviews -------------------------------------------

class ReviewsState extends Equatable {
  final ViewStatus status;
  final MentorReviews? data;

  const ReviewsState({this.status = ViewStatus.initial, this.data});

  ReviewsState copyWith({ViewStatus? status, MentorReviews? data}) {
    return ReviewsState(
      status: status ?? this.status,
      data: data ?? this.data,
    );
  }

  @override
  List<Object?> get props => [status, data];
}

class ReviewsCubit extends Cubit<ReviewsState> {
  final ReviewService _service;
  final String mentorId;

  ReviewsCubit({required this.mentorId, ReviewService? service})
      : _service = service ?? ReviewService(),
        super(const ReviewsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final data = await _service.getMentorReviews(mentorId);
      emit(state.copyWith(status: ViewStatus.success, data: data));
    } catch (_) {
      // Reviews are non-critical — degrade to the empty state.
      emit(state.copyWith(status: ViewStatus.failure));
    }
  }
}

// --- Rate-a-mentor form ----------------------------------------------------

class RateReviewState extends Equatable {
  final int rating;
  final bool submitting;
  final String? error;

  const RateReviewState({
    this.rating = 0,
    this.submitting = false,
    this.error,
  });

  RateReviewState copyWith({
    int? rating,
    bool? submitting,
    String? error,
    bool clearError = false,
  }) {
    return RateReviewState(
      rating: rating ?? this.rating,
      submitting: submitting ?? this.submitting,
      error: clearError ? null : (error ?? this.error),
    );
  }

  @override
  List<Object?> get props => [rating, submitting, error];
}

class RateReviewCubit extends Cubit<RateReviewState> {
  final ReviewService _service;
  final String studentId;
  final String mentorId;

  RateReviewCubit({
    required this.studentId,
    required this.mentorId,
    ReviewService? service,
  })  : _service = service ?? ReviewService(),
        super(const RateReviewState());

  void setRating(int rating) =>
      emit(state.copyWith(rating: rating, clearError: true));

  /// Returns true on a successful submit so the sheet can close.
  Future<bool> submit(String comment) async {
    if (state.rating == 0) {
      emit(state.copyWith(error: 'Please tap a star to choose a rating.'));
      return false;
    }
    emit(state.copyWith(submitting: true, clearError: true));
    try {
      await _service.submitReview(
        studentId: studentId,
        mentorId: mentorId,
        rating: state.rating,
        comment: comment,
      );
      return true;
    } catch (e) {
      emit(state.copyWith(submitting: false, error: e.toString()));
      return false;
    }
  }
}
