import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/review.dart';
import '../../../data/services/review_service.dart';
import '../../../state/auth/auth_cubit.dart';

/// Reviews block for the mentor detail screen: average summary, the list of
/// ratings, and — for signed-in students — a "Rate" action that opens a sheet.
class MentorReviewsSection extends StatefulWidget {
  final String mentorId;
  final String mentorName;

  const MentorReviewsSection({
    super.key,
    required this.mentorId,
    required this.mentorName,
  });

  @override
  State<MentorReviewsSection> createState() => _MentorReviewsSectionState();
}

class _MentorReviewsSectionState extends State<MentorReviewsSection> {
  final ReviewService _service = ReviewService();

  MentorReviews? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getMentorReviews(widget.mentorId);
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _openRateSheet() async {
    final auth = context.read<AuthCubit>();
    final studentId = auth.user?.id;
    if (studentId == null || studentId.isEmpty) return;

    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RateSheet(
        mentorName: widget.mentorName,
        onSubmit: (rating, comment) => _service.submitReview(
          studentId: studentId,
          mentorId: widget.mentorId,
          rating: rating,
          comment: comment,
        ),
      ),
    );

    if (submitted == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanks! Your rating was submitted.')),
      );
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthCubit>().state;
    final canRate = auth.isAuthenticated && (auth.user?.isStudent ?? false);
    final data = _data;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              height: 30.h,
              width: 30.w,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(9.r),
              ),
              child: Icon(LucideIcons.star, size: 17.sp, color: AppColors.primary),
            ),
            SizedBox(width: 10.w),
            Text(
              'Reviews',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 17.sp,
                color: AppColors.textPrimary,
              ),
            ),
            const Spacer(),
            if (canRate)
              TextButton.icon(
                onPressed: _openRateSheet,
                icon: Icon(Icons.rate_review_outlined, size: 16.sp),
                label: const Text('Rate'),
                style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              ),
          ],
        ),
        SizedBox(height: 12.h),
        if (_loading)
          Padding(
            padding: EdgeInsets.symmetric(vertical: 16.h),
            child: const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          )
        else if (data == null || data.count == 0)
          _emptyState(canRate)
        else ...[
          _summaryCard(data),
          SizedBox(height: 14.h),
          ...data.reviews.map(_reviewCard),
        ],
      ],
    );
  }

  Widget _emptyState(bool canRate) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(18.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(LucideIcons.messageSquare, size: 26.sp, color: AppColors.textMuted),
          SizedBox(height: 10.h),
          Text(
            canRate
                ? 'No reviews yet — be the first to rate ${widget.mentorName}.'
                : 'No reviews yet.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13.5.sp, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _summaryCard(MentorReviews data) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data.average.toStringAsFixed(1),
                style: TextStyle(
                  fontSize: 34.sp,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  height: 1,
                ),
              ),
              SizedBox(height: 6.h),
              _StarRow(rating: data.average, size: 16.sp),
            ],
          ),
          SizedBox(width: 18.w),
          Expanded(
            child: Text(
              'Based on ${data.count} ${data.count == 1 ? 'review' : 'reviews'} '
              'from students & parents.',
              style: TextStyle(
                fontSize: 13.sp,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _reviewCard(Review review) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  review.studentName.isEmpty ? 'Anonymous' : review.studentName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (review.createdAt != null)
                Text(
                  DateFormat('MMM d, yyyy').format(review.createdAt!),
                  style: TextStyle(fontSize: 11.5.sp, color: AppColors.textMuted),
                ),
            ],
          ),
          SizedBox(height: 6.h),
          _StarRow(rating: review.rating.toDouble(), size: 14.sp),
          if (review.comment.isNotEmpty) ...[
            SizedBox(height: 8.h),
            Text(
              review.comment,
              style: TextStyle(
                fontSize: 13.5.sp,
                height: 1.5,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Read-only star row that supports half-ish rounding for averages.
class _StarRow extends StatelessWidget {
  final double rating;
  final double size;

  const _StarRow({required this.rating, required this.size});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = i < rating.round();
        return Padding(
          padding: EdgeInsets.only(right: 3.w),
          child: Icon(
            filled ? Icons.star_rounded : Icons.star_outline_rounded,
            size: size,
            color: filled ? AppColors.star : AppColors.border,
          ),
        );
      }),
    );
  }
}

/// Bottom sheet for submitting a rating. Returns `true` via Navigator.pop on a
/// successful submit.
class _RateSheet extends StatefulWidget {
  final String mentorName;
  final Future<void> Function(int rating, String comment) onSubmit;

  const _RateSheet({required this.mentorName, required this.onSubmit});

  @override
  State<_RateSheet> createState() => _RateSheetState();
}

class _RateSheetState extends State<_RateSheet> {
  final TextEditingController _comment = TextEditingController();
  int _rating = 0;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      setState(() => _error = 'Please tap a star to choose a rating.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await widget.onSubmit(_rating, _comment.text.trim());
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(4.r),
                ),
              ),
            ),
            SizedBox(height: 18.h),
            Text(
              'Rate ${widget.mentorName}',
              style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 4.h),
            Text(
              'Share your experience to help other students & parents.',
              style: TextStyle(fontSize: 13.sp, color: AppColors.textSecondary),
            ),
            SizedBox(height: 18.h),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) {
                  final value = i + 1;
                  final active = value <= _rating;
                  return GestureDetector(
                    onTap: () => setState(() => _rating = value),
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6.w),
                      child: Icon(
                        active ? Icons.star_rounded : Icons.star_outline_rounded,
                        size: 40.sp,
                        color: active ? AppColors.star : AppColors.border,
                      ),
                    ),
                  );
                }),
              ),
            ),
            SizedBox(height: 18.h),
            TextField(
              controller: _comment,
              maxLines: 3,
              maxLength: 500,
              decoration: const InputDecoration(
                hintText: 'Add a comment (optional)',
              ),
            ),
            if (_error != null) ...[
              SizedBox(height: 8.h),
              Text(
                _error!,
                style: TextStyle(color: AppColors.danger, fontSize: 12.5.sp),
              ),
            ],
            SizedBox(height: 14.h),
            SizedBox(
              width: double.infinity,
              height: 52.h,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14.r),
                  ),
                ),
                child: _submitting
                    ? SizedBox(
                        height: 20.h,
                        width: 20.h,
                        child: const CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        'Submit rating',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15.sp,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
