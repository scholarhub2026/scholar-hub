import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/booking_draft.dart';
import '../../../data/models/mentor.dart';
import '../../../widgets/network_avatar.dart';

class BookingPlanStep extends StatefulWidget {
  final BookingDraft draft;
  final VoidCallback onChanged;

  const BookingPlanStep({
    super.key,
    required this.draft,
    required this.onChanged,
  });

  @override
  State<BookingPlanStep> createState() => _BookingPlanStepState();
}

class _BookingPlanStepState extends State<BookingPlanStep> {
  final GlobalKey _typeKey = GlobalKey();
  final GlobalKey _subjectKey = GlobalKey();

  BookingDraft get draft => widget.draft;
  VoidCallback get onChanged => widget.onChanged;
  Mentor get mentor => widget.draft.mentor;

  /// Scrolls a just-revealed section into view so the next required choice is
  /// never hidden below the fold.
  void _reveal(GlobalKey key) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = key.currentContext;
      if (ctx != null && mounted) {
        Scrollable.ensureVisible(
          ctx,
          alignment: 0.05,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
      children: [
        _mentorHeader(),
        SizedBox(height: 22.h),
        _label('1. Select Syllabus'),
        SizedBox(height: 10.h),
        _syllabusChips(),
        if (draft.syllabus != null) ...[
          SizedBox(height: 22.h),
          _label('2. Select Class'),
          SizedBox(height: 10.h),
          _classList(),
        ],
        if (draft.selectedClass != null) ...[
          SizedBox(height: 22.h),
          KeyedSubtree(key: _typeKey, child: _label('3. Booking Type')),
          SizedBox(height: 10.h),
          _bookingTypeSelector(),
        ],
        if (draft.selectedClass != null && draft.requiresSubjects) ...[
          SizedBox(height: 22.h),
          KeyedSubtree(
            key: _subjectKey,
            child: _label(
                '4. Select Subject${draft.bookingType == BookingType.multiple ? 's' : ''}'),
          ),
          SizedBox(height: 10.h),
          _subjectList(),
        ],
        if (draft.totalAmount > 0) ...[
          SizedBox(height: 24.h),
          _totalBanner(),
        ],
      ],
    );
  }

  Widget _mentorHeader() {
    return Container(
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          NetworkAvatar(
            imageUrl: mentor.profilePic,
            initials: Formatters.initials(mentor.firstName, mentor.lastName),
            size: 50.r,
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mentor.fullName,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  mentor.headline,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5.sp,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 15.5.sp,
          color: AppColors.textPrimary,
        ),
      );

  Widget _syllabusChips() {
    final syllabi = mentor.syllabi;
    if (syllabi.isEmpty) {
      return const Text(
        'This mentor has not published a syllabus yet.',
        style: TextStyle(color: AppColors.textMuted),
      );
    }
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: syllabi.map((s) {
        final selected = draft.syllabus == s;
        return GestureDetector(
          onTap: () {
            draft.syllabus = s;
            draft.selectedClass = null;
            draft.bookingType = null;
            draft.selectedSubjectIds.clear();
            onChanged();
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding:
                EdgeInsets.symmetric(horizontal: 18.w, vertical: 11.h),
            decoration: BoxDecoration(
              gradient: selected ? AppColors.brandGradient : null,
              color: selected ? null : AppColors.surface,
              borderRadius: BorderRadius.circular(14.r),
              border: Border.all(
                color: selected ? Colors.transparent : AppColors.border,
              ),
            ),
            child: Text(
              s,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _classList() {
    final classes = draft.availableClasses;
    return Column(
      children: classes.map((c) {
        final selected = draft.selectedClass?.id == c.id &&
            draft.selectedClass?.className == c.className;
        return Padding(
          padding: EdgeInsets.only(bottom: 10.h),
          child: GestureDetector(
            onTap: () {
              draft.selectedClass = c;
              draft.bookingType = null;
              draft.selectedSubjectIds.clear();
              onChanged();
              _reveal(_typeKey);
            },
            child: Container(
              padding: EdgeInsets.all(16.r),
              decoration: BoxDecoration(
                color: selected ? AppColors.primaryLight : AppColors.surface,
                borderRadius: BorderRadius.circular(16.r),
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.border,
                  width: selected ? 1.6 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    selected
                        ? LucideIcons.checkCircle2
                        : LucideIcons.circle,
                    color: selected ? AppColors.primary : AppColors.textMuted,
                    size: 22.sp,
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c.className,
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15.sp,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '${c.subjects.length} subjects available',
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    Formatters.rupeesPlain(c.price),
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15.sp,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _bookingTypeSelector() {
    const types = BookingType.values;
    return Row(
      children: types.map((t) {
        final selected = draft.bookingType == t;
        // "Full Class" needs no subject selection.
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: 8.w),
            child: GestureDetector(
              onTap: () {
                draft.bookingType = t;
                draft.selectedSubjectIds.clear();
                onChanged();
                if (draft.requiresSubjects) _reveal(_subjectKey);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: EdgeInsets.symmetric(vertical: 14.h),
                decoration: BoxDecoration(
                  gradient: selected ? AppColors.brandGradient : null,
                  color: selected ? null : AppColors.surface,
                  borderRadius: BorderRadius.circular(14.r),
                  border: Border.all(
                    color: selected ? Colors.transparent : AppColors.border,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _typeIcon(t),
                      size: 20.sp,
                      color: selected ? Colors.white : AppColors.primary,
                    ),
                    SizedBox(height: 6.h),
                    Text(
                      _typeShort(t),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11.5.sp,
                        fontWeight: FontWeight.w700,
                        color: selected ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  IconData _typeIcon(BookingType t) {
    switch (t) {
      case BookingType.full:
        return LucideIcons.layers;
      case BookingType.individual:
        return LucideIcons.bookOpen;
      case BookingType.multiple:
        return LucideIcons.library;
    }
  }

  String _typeShort(BookingType t) {
    switch (t) {
      case BookingType.full:
        return 'Full Class';
      case BookingType.individual:
        return 'Single\nSubject';
      case BookingType.multiple:
        return 'Multiple\nSubjects';
    }
  }

  Widget _subjectList() {
    final subjects = draft.classSubjects;
    final isMultiple = draft.bookingType == BookingType.multiple;
    if (subjects.isEmpty) {
      return const Text(
        'No subjects listed for this class.',
        style: TextStyle(color: AppColors.textMuted),
      );
    }
    return Column(
      children: subjects.map((s) {
        final selected = draft.selectedSubjectIds.contains(s.id);
        return Padding(
          padding: EdgeInsets.only(bottom: 10.h),
          child: GestureDetector(
            onTap: () {
              if (isMultiple) {
                selected
                    ? draft.selectedSubjectIds.remove(s.id)
                    : draft.selectedSubjectIds.add(s.id);
              } else {
                draft.selectedSubjectIds
                  ..clear()
                  ..add(s.id);
              }
              onChanged();
            },
            child: Container(
              padding: EdgeInsets.all(14.r),
              decoration: BoxDecoration(
                color: selected ? AppColors.primaryLight : AppColors.surface,
                borderRadius: BorderRadius.circular(14.r),
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.border,
                  width: selected ? 1.6 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isMultiple
                        ? (selected
                            ? LucideIcons.checkSquare
                            : LucideIcons.square)
                        : (selected
                            ? LucideIcons.checkCircle2
                            : LucideIcons.circle),
                    color: selected ? AppColors.primary : AppColors.textMuted,
                    size: 22.sp,
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Text(
                      s.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14.5.sp,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Text(
                    Formatters.rupeesPlain(s.price),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _totalBanner() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 16.h),
      decoration: BoxDecoration(
        color: AppColors.successSoft,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.wallet, color: AppColors.success),
          SizedBox(width: 12.w),
          const Text(
            'Total Price',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const Spacer(),
          Text(
            Formatters.rupeesPlain(draft.totalAmount),
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 20.sp,
              color: AppColors.success,
            ),
          ),
        ],
      ),
    );
  }
}
