import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/mentor.dart';
import '../../data/services/mentor_service.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/network_avatar.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/state_views.dart';
import '../auth/sign_in_prompt.dart';
import 'widgets/mentor_reviews_section.dart';

class MentorDetailScreen extends StatefulWidget {
  final String mentorId;

  const MentorDetailScreen({super.key, required this.mentorId});

  @override
  State<MentorDetailScreen> createState() => _MentorDetailScreenState();
}

class _MentorDetailScreenState extends State<MentorDetailScreen> {
  final MentorService _service = MentorService();
  Mentor? _mentor;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final mentor = await _service.getMentorById(widget.mentorId);
      if (!mounted) return;
      setState(() {
        _mentor = mentor;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  /// Booking requires an account. Signed-out users are prompted to sign in /
  /// sign up first, then continued into the booking flow automatically.
  Future<void> _startBooking(Mentor mentor) async {
    if (context.read<AuthCubit>().state.isAuthenticated) {
      AppNavigator.toBooking(context, mentor);
      return;
    }

    final intent = await showSignInPrompt(
      context,
      title: 'Sign in to book',
      message: 'Sign in or create an account to book a session with '
          '${mentor.firstName} and track it in your dashboard.',
    );
    if (intent == null || !mounted) return;

    if (intent == AuthIntent.signIn) {
      await AppNavigator.toLogin(context);
    } else {
      await AppNavigator.toSignup(context);
    }
    if (!mounted) return;

    // Continue into booking only if they actually signed in.
    if (context.read<AuthCubit>().state.isAuthenticated) {
      AppNavigator.toBooking(context, mentor);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _buildContent(),
      bottomNavigationBar: _mentor == null ? null : _buildBookingBar(_mentor!),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }
    if (_error != null || _mentor == null) {
      return SafeArea(
        child: Column(
          children: [
            _topBar(),
            Expanded(
              child: ErrorStateView(
                message: _error ?? 'Mentor not found.',
                onRetry: _load,
              ),
            ),
          ],
        ),
      );
    }
    return _buildBody(_mentor!);
  }

  Widget _topBar() {
    return Padding(
      padding: EdgeInsets.fromLTRB(12.w, 8.h, 12.w, 0),
      child: Row(
        children: [
          _circleButton(LucideIcons.arrowLeft, () => Navigator.pop(context)),
        ],
      ),
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 2,
      shadowColor: Colors.black26,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(10.r),
          child: Icon(icon, size: 20.sp, color: AppColors.textPrimary),
        ),
      ),
    );
  }

  Widget _buildBody(Mentor mentor) {
    final about = Formatters.stripHtml(mentor.additionalDetails);
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 280.h,
          pinned: true,
          stretch: true,
          backgroundColor: AppColors.primaryDark,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          leading: Padding(
            padding: EdgeInsets.all(8.r),
            child: _circleButton(LucideIcons.arrowLeft, () => Navigator.pop(context)),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                CoverImage(
                  imageUrl: mentor.profilePic,
                  height: 280.h,
                  radius: 0,
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.25),
                        Colors.black.withValues(alpha: 0.7),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 20.w,
                  right: 20.w,
                  bottom: 20.h,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      NetworkAvatar(
                        imageUrl: mentor.profilePic,
                        initials: Formatters.initials(
                            mentor.firstName, mentor.lastName),
                        size: 64.r,
                      ),
                      SizedBox(width: 14.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              mentor.fullName,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 22.sp,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (mentor.educationQualification.isNotEmpty)
                              Text(
                                mentor.educationQualification,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.9),
                                  fontSize: 13.5.sp,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 140.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _statsRow(mentor),
                SizedBox(height: 22.h),
                if (mentor.classLabels.isNotEmpty) ...[
                  _sectionTitle('Classes', LucideIcons.graduationCap,
                      count: mentor.classLabels.length),
                  SizedBox(height: 14.h),
                  _classesGrouped(mentor),
                  SizedBox(height: 22.h),
                ],
                if (mentor.subjectNames.isNotEmpty) ...[
                  _sectionTitle('Subjects', LucideIcons.bookOpen,
                      count: mentor.subjectNames.length),
                  SizedBox(height: 14.h),
                  _subjectsGrid(mentor.subjectNames),
                  SizedBox(height: 22.h),
                ],
                if (mentor.availableSlots.isNotEmpty) ...[
                  _sectionTitle('Availability', LucideIcons.clock),
                  SizedBox(height: 12.h),
                  _wrapChips(
                    mentor.availableSlots.map(Formatters.slotLabel).toList(),
                    AppColors.successSoft,
                    AppColors.success,
                  ),
                  SizedBox(height: 22.h),
                ],
                _sectionTitle('About', LucideIcons.info),
                SizedBox(height: 14.h),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(16.r),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18.r),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    about.isEmpty
                        ? '${mentor.firstName} is a verified Scholar Hub mentor '
                            'ready to help you reach your academic goals.'
                        : about,
                    style: TextStyle(
                      fontSize: 14.5.sp,
                      height: 1.6,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                SizedBox(height: 22.h),
                MentorReviewsSection(
                  mentorId: mentor.id,
                  mentorName: mentor.firstName,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _statsRow(Mentor mentor) {
    return Row(
      children: [
        _statCard(
          LucideIcons.star,
          mentor.ratingValue.toStringAsFixed(1),
          'Rating',
          AppColors.star,
        ),
        SizedBox(width: 12.w),
        _statCard(
          LucideIcons.briefcase,
          mentor.experience.isEmpty ? 'Expert' : _shorten(mentor.experience),
          'Experience',
          AppColors.primary,
        ),
        SizedBox(width: 12.w),
        _statCard(
          LucideIcons.bookOpen,
          '${mentor.subjectNames.length}',
          'Subjects',
          AppColors.violet,
        ),
      ],
    );
  }

  String _shorten(String s) => s.length > 10 ? '${s.substring(0, 10)}…' : s;

  Widget _statCard(IconData icon, String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 8.w),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1E293B).withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              height: 40.h,
              width: 40.w,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Icon(icon, color: color, size: 21.sp),
            ),
            SizedBox(height: 10.h),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 15.sp,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5.sp,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title, IconData icon, {int? count}) {
    return Row(
      children: [
        Container(
          height: 30.h,
          width: 30.w,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(9.r),
          ),
          child: Icon(icon, size: 17.sp, color: AppColors.primary),
        ),
        SizedBox(width: 10.w),
        Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 17.sp,
            color: AppColors.textPrimary,
          ),
        ),
        if (count != null) ...[
          SizedBox(width: 8.w),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Text(
              '$count',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 12.sp,
                color: AppColors.primaryDark,
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// Classes grouped under their syllabus, each group with its own accent — far
  /// easier to scan than one flat wall of identical chips.
  Widget _classesGrouped(Mentor mentor) {
    const accents = [AppColors.primary, AppColors.indigo, AppColors.violet];
    final syllabi = mentor.syllabi;
    return Column(
      children: [
        for (var i = 0; i < syllabi.length; i++)
          _syllabusGroup(
            syllabi[i],
            mentor.classesForSyllabus(syllabi[i]),
            accents[i % accents.length],
          ),
      ],
    );
  }

  Widget _syllabusGroup(String syllabus, List<MentorClass> classes, Color accent) {
    final names = <String>{};
    for (final c in classes) {
      if (c.className.isNotEmpty) names.add(c.className);
    }
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(18.r),
        border: Border.all(color: accent.withValues(alpha: 0.16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 8.h,
                width: 8.w,
                decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
              ),
              SizedBox(width: 8.w),
              Text(
                syllabus,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13.5.sp,
                  color: accent,
                  letterSpacing: 0.2,
                ),
              ),
              SizedBox(width: 6.w),
              Text(
                '· ${names.length} ${names.length == 1 ? 'class' : 'classes'}',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: names
                .map(
                  (name) => Container(
                    padding: EdgeInsets.symmetric(
                        horizontal: 12.w, vertical: 7.h),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(10.r),
                      border: Border.all(color: accent.withValues(alpha: 0.25)),
                    ),
                    child: Text(
                      name,
                      style: TextStyle(
                        color: accent,
                        fontWeight: FontWeight.w700,
                        fontSize: 12.5.sp,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  /// Subjects rendered as colourful icon chips — each subject gets a relevant
  /// icon and rotates through the brand subject palette so the list reads as a
  /// vibrant, scannable grid rather than a wall of identical pills.
  Widget _subjectsGrid(List<String> subjects) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < subjects.length; i++)
          _subjectChip(subjects[i],
              AppColors.subjectSwatches[i % AppColors.subjectSwatches.length]),
      ],
    );
  }

  Widget _subjectChip(String name, List<Color> swatch) {
    final bg = swatch[0];
    final fg = swatch[1];
    return Container(
      padding: EdgeInsets.fromLTRB(8.w, 8.h, 14.w, 8.h),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: fg.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 30.h,
            width: 30.w,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.75),
              borderRadius: BorderRadius.circular(10.r),
            ),
            child: Icon(_subjectIcon(name), size: 17.sp, color: fg),
          ),
          SizedBox(width: 9.w),
          Text(
            _titleCase(name),
            style: TextStyle(
              color: fg,
              fontWeight: FontWeight.w700,
              fontSize: 13.sp,
            ),
          ),
        ],
      ),
    );
  }

  String _titleCase(String s) => s
      .split(' ')
      .where((w) => w.isNotEmpty)
      .map((w) => w[0].toUpperCase() + w.substring(1))
      .join(' ');

  /// Best-effort keyword mapping from a subject name to a fitting icon.
  IconData _subjectIcon(String raw) {
    final n = raw.toLowerCase();
    bool has(String k) => n.contains(k);
    if (has('math')) return LucideIcons.calculator;
    if (has('physic')) return LucideIcons.atom;
    if (has('chem')) return LucideIcons.testTube;
    if (has('bio')) return LucideIcons.dna;
    if (has('history')) return LucideIcons.landmark;
    if (has('geograph')) return LucideIcons.map;
    if (has('econom')) return LucideIcons.trendingUp;
    if (has('politic') || has('civic')) return LucideIcons.scale;
    if (has('social')) return LucideIcons.globe2;
    if (has('comput') || has('coding') || has('it')) return LucideIcons.code;
    if (has('music')) return LucideIcons.music;
    if (has('art') || has('draw')) return LucideIcons.palette;
    if (has('hindi') ||
        has('english') ||
        has('malayalam') ||
        has('language') ||
        has('sanskrit')) {
      return LucideIcons.languages;
    }
    if (has('science')) return LucideIcons.flaskConical;
    return LucideIcons.bookOpen;
  }

  Widget _wrapChips(List<String> items, Color bg, Color fg) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: items
          .map(
            (label) => Container(
              padding:
                  EdgeInsets.symmetric(horizontal: 12.w, vertical: 7.h),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: fg,
                  fontWeight: FontWeight.w600,
                  fontSize: 12.5.sp,
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildBookingBar(Mentor mentor) {
    final price = mentor.startingPrice;
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 14.h, 20.w, 20.h),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  price != null ? 'Starting from' : 'Sessions',
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: AppColors.textMuted,
                  ),
                ),
                Text(
                  price != null ? Formatters.rupeesPlain(price) : 'Flexible',
                  style: TextStyle(
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: mentor.isAvailable
                  ? PrimaryButton(
                      label: 'Book Now',
                      icon: LucideIcons.calendarCheck,
                      onPressed: () => _startBooking(mentor),
                    )
                  : Container(
                      height: 54.h,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.dangerSoft,
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                      child: const Text(
                        'Slots Currently Full',
                        style: TextStyle(
                          color: AppColors.danger,
                          fontWeight: FontWeight.w700,
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
