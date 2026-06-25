import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/constants/app_content.dart';
import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/subject_visuals.dart';
import '../../data/services/catalog_service.dart';
import '../../widgets/state_views.dart';

/// Full directory of subjects. Tapping one drills into the mentors that teach
/// it.
class SubjectsScreen extends StatefulWidget {
  const SubjectsScreen({super.key});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  final CatalogService _catalog = CatalogService();

  List<String> _subjects = [];
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
      final items = await _catalog.getSubjects();
      final names = <String>{};
      for (final s in items) {
        if (s.name.trim().isNotEmpty) names.add(s.name.trim());
      }
      if (!mounted) return;
      setState(() {
        // Fall back to the curated set if the catalog is empty.
        _subjects = names.isNotEmpty
            ? names.toList()
            : AppContent.subjects.map((s) => s.name).toList();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Browse Subjects'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return GridView.builder(
        padding: EdgeInsets.all(20.r),
        itemCount: 8,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 14,
          crossAxisSpacing: 14,
          childAspectRatio: 1.5,
        ),
        itemBuilder: (_, _) => const ShimmerBox(height: 100, radius: 22),
      );
    }
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }
    if (_subjects.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.bookOpen,
        title: 'No subjects yet',
        message: 'Subjects will appear here once they are available.',
      );
    }
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 28.h),
      itemCount: _subjects.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 1.45,
      ),
      itemBuilder: (context, i) {
        final name = _subjects[i];
        final swatch =
            AppColors.subjectSwatches[i % AppColors.subjectSwatches.length];
        return _SubjectCard(
          name: subjectTitle(name),
          icon: subjectIcon(name),
          background: swatch[0],
          foreground: swatch[1],
          onTap: () => AppNavigator.toSubjectMentors(context, name),
        ).animate().fadeIn(duration: 250.ms, delay: (i * 35).ms).moveY(
              begin: 12,
              end: 0,
            );
      },
    );
  }
}

class _SubjectCard extends StatelessWidget {
  final String name;
  final IconData icon;
  final Color background;
  final Color foreground;
  final VoidCallback onTap;

  const _SubjectCard({
    required this.name,
    required this.icon,
    required this.background,
    required this.foreground,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      borderRadius: BorderRadius.circular(22.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(22.r),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(16.r),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    height: 44.h,
                    width: 44.w,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(14.r),
                    ),
                    child: Icon(icon, color: foreground, size: 22.sp),
                  ),
                  const Spacer(),
                  Icon(LucideIcons.arrowUpRight, color: foreground, size: 20.sp),
                ],
              ),
              Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: foreground,
                  fontWeight: FontWeight.w800,
                  fontSize: 15.sp,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
