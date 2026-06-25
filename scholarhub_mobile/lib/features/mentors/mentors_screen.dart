import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/mentor.dart';
import '../../data/services/mentor_service.dart';
import '../../widgets/state_views.dart';
import 'widgets/mentor_card.dart';

class MentorsScreen extends StatefulWidget {
  /// Pre-applied search query (e.g. a subject tapped on the home feed).
  final String? initialQuery;

  /// Bumped each time a new filter request comes from outside so the same
  /// subject can be re-applied even after the user cleared the search.
  final int filterNonce;

  /// When true the screen is pushed (drill-down) and shows a back button +
  /// [lockedTitle] instead of the default browse heading.
  final bool showBack;
  final String? lockedTitle;

  const MentorsScreen({
    super.key,
    this.initialQuery,
    this.filterNonce = 0,
    this.showBack = false,
    this.lockedTitle,
  });

  @override
  State<MentorsScreen> createState() => _MentorsScreenState();
}

class _MentorsScreenState extends State<MentorsScreen> {
  final MentorService _service = MentorService();
  final TextEditingController _searchController = TextEditingController();

  List<Mentor> _all = [];
  bool _loading = true;
  String? _error;
  String _query = '';
  String? _syllabus;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _query = widget.initialQuery!.toLowerCase();
      _searchController.text = widget.initialQuery!;
    }
    _load();
  }

  @override
  void didUpdateWidget(MentorsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // A new external filter request arrived (subject tapped on home).
    if (widget.filterNonce != oldWidget.filterNonce &&
        widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
      setState(() {
        _query = widget.initialQuery!.toLowerCase();
        _syllabus = null;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final mentors = await _service.getApprovedMentors();
      if (!mounted) return;
      setState(() {
        _all = mentors;
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

  List<String> get _syllabi {
    final set = <String>{};
    for (final m in _all) {
      set.addAll(m.syllabi);
    }
    return set.toList();
  }

  List<Mentor> get _filtered {
    return _all.where((m) {
      final matchesQuery = _query.isEmpty ||
          m.fullName.toLowerCase().contains(_query) ||
          m.subjectNames
              .any((s) => s.toLowerCase().contains(_query)) ||
          m.headline.toLowerCase().contains(_query);
      final matchesSyllabus = _syllabus == null || m.syllabi.contains(_syllabus);
      return matchesQuery && matchesSyllabus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final syllabi = _syllabi;
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, (widget.showBack ? 4 : 12).h, 20.w, 16.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.showBack) ...[
            Row(
              children: [
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: const Icon(LucideIcons.arrowLeft),
                  onPressed: () => Navigator.pop(context),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    widget.lockedTitle ?? 'Mentors',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16.h),
          ] else ...[
            Text(
              'Find your perfect mentor',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 4.h),
            Text(
              'Browse verified experts across subjects & syllabi.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
            ),
            SizedBox(height: 16.h),
          ],
          // Search
          TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
            decoration: InputDecoration(
              hintText: 'Search by name or subject',
              prefixIcon:
                  const Icon(LucideIcons.search, color: AppColors.textMuted),
              suffixIcon: _query.isEmpty
                  ? null
                  : IconButton(
                      icon: Icon(LucideIcons.x, size: 18.sp),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    ),
            ),
          ),
          if (syllabi.isNotEmpty) ...[
            SizedBox(height: 14.h),
            SizedBox(
              height: 36.h,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _FilterChip(
                    label: 'All',
                    selected: _syllabus == null,
                    onTap: () => setState(() => _syllabus = null),
                  ),
                  ...syllabi.map(
                    (s) => _FilterChip(
                      label: s,
                      selected: _syllabus == s,
                      onTap: () => setState(() => _syllabus = s),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return ShimmerList(itemHeight: 230.h);
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    final mentors = _filtered;
    if (mentors.isEmpty) {
      return EmptyState(
        icon: LucideIcons.searchX,
        title: 'No mentors found',
        message: _all.isEmpty
            ? 'There are no mentors available right now. Please check back later.'
            : 'Try adjusting your search or filters.',
        actionLabel: _all.isEmpty ? 'Refresh' : null,
        onAction: _all.isEmpty ? _load : null,
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView.separated(
        padding: EdgeInsets.fromLTRB(20.w, 4.h, 20.w, 120.h),
        itemCount: mentors.length,
        separatorBuilder: (_, _) => SizedBox(height: 16.h),
        itemBuilder: (context, index) {
          final mentor = mentors[index];
          return MentorCard(
            mentor: mentor,
            onTap: () => AppNavigator.toMentorDetail(context, mentor.id),
          )
              .animate()
              .fadeIn(duration: 300.ms, delay: (index * 40).ms)
              .moveY(begin: 14, end: 0);
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(right: 8.w),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
          decoration: BoxDecoration(
            gradient: selected ? AppColors.brandGradient : null,
            color: selected ? null : AppColors.surface,
            borderRadius: BorderRadius.circular(20.r),
            border: Border.all(
              color: selected ? Colors.transparent : AppColors.border,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.w600,
              fontSize: 13.sp,
            ),
          ),
        ),
      ),
    );
  }
}
