import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../state/view_status.dart';
import '../../widgets/state_views.dart';
import 'mentors_cubit.dart';
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
  late final MentorsCubit _cubit;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cubit = MentorsCubit();
    final q = widget.initialQuery;
    if (q != null && q.isNotEmpty) {
      _searchController.text = q;
      _cubit.setQuery(q);
    }
    _cubit.load();
  }

  @override
  void didUpdateWidget(MentorsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // A new external filter request arrived (subject tapped on home).
    if (widget.filterNonce != oldWidget.filterNonce &&
        widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
      _cubit.applyExternalQuery(widget.initialQuery!);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: _MentorsView(
        controller: _searchController,
        showBack: widget.showBack,
        lockedTitle: widget.lockedTitle,
      ),
    );
  }
}

class _MentorsView extends StatelessWidget {
  final TextEditingController controller;
  final bool showBack;
  final String? lockedTitle;

  const _MentorsView({
    required this.controller,
    required this.showBack,
    required this.lockedTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: BlocBuilder<MentorsCubit, MentorsState>(
          builder: (context, state) {
            return Column(
              children: [
                _buildHeader(context, state),
                Expanded(child: _buildBody(context, state)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, MentorsState state) {
    final cubit = context.read<MentorsCubit>();
    final syllabi = state.syllabi;
    final classes = state.classOptions;
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, (showBack ? 4 : 12).h, 20.w, 16.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showBack) ...[
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
                    lockedTitle ?? 'Mentors',
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
          // Search — matches name, subject or location.
          TextField(
            controller: controller,
            onChanged: cubit.setQuery,
            decoration: InputDecoration(
              hintText: 'Search by name, subject or location',
              prefixIcon:
                  const Icon(LucideIcons.search, color: AppColors.textMuted),
              suffixIcon: state.query.isEmpty
                  ? null
                  : IconButton(
                      icon: Icon(LucideIcons.x, size: 18.sp),
                      onPressed: () {
                        controller.clear();
                        cubit.setQuery('');
                      },
                    ),
            ),
          ),
          if (syllabi.isNotEmpty) ...[
            SizedBox(height: 14.h),
            _chipRow(
              context,
              label: 'All boards',
              options: syllabi,
              selected: state.syllabus,
              onAll: () => cubit.setSyllabus(null),
              onSelect: cubit.setSyllabus,
            ),
          ],
          if (classes.isNotEmpty) ...[
            SizedBox(height: 10.h),
            _chipRow(
              context,
              label: 'All classes',
              options: classes,
              selected: state.classFilter,
              onAll: () => cubit.setClass(null),
              onSelect: cubit.setClass,
            ),
          ],
        ],
      ),
    );
  }

  Widget _chipRow(
    BuildContext context, {
    required String label,
    required List<String> options,
    required String? selected,
    required VoidCallback onAll,
    required ValueChanged<String> onSelect,
  }) {
    return SizedBox(
      height: 36.h,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _FilterChip(
            label: label,
            selected: selected == null,
            onTap: onAll,
          ),
          ...options.map(
            (o) => _FilterChip(
              label: o,
              selected: selected == o,
              onTap: () => onSelect(o),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context, MentorsState state) {
    final cubit = context.read<MentorsCubit>();
    if (state.status.isLoading || state.status.isInitial) {
      return ShimmerList(itemHeight: 230.h);
    }
    if (state.status.isFailure) {
      return ErrorStateView(
        message: state.error ?? 'Unable to load mentors.',
        onRetry: cubit.load,
      );
    }
    final mentors = state.filtered;
    if (mentors.isEmpty) {
      return EmptyState(
        icon: LucideIcons.searchX,
        title: 'No mentors found',
        message: state.all.isEmpty
            ? 'There are no mentors available right now. Please check back later.'
            : 'Try adjusting your search or filters.',
        actionLabel: state.all.isEmpty ? 'Refresh' : null,
        onAction: state.all.isEmpty ? cubit.load : null,
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: cubit.load,
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
