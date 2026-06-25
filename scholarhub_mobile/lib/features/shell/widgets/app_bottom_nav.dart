import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';

class NavDestination {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const NavDestination(this.icon, this.activeIcon, this.label);
}

const kNavDestinations = <NavDestination>[
  NavDestination(LucideIcons.home, LucideIcons.home, 'Home'),
  NavDestination(LucideIcons.search, LucideIcons.search, 'Mentors'),
  NavDestination(
      LucideIcons.calendarCheck, LucideIcons.calendarCheck, 'Bookings'),
  NavDestination(LucideIcons.user, LucideIcons.user, 'Profile'),
];

/// Floating, frosted-glass pill navigation bar with an animated selected
/// indicator and a subtle icon pop. Defaults to the student [kNavDestinations]
/// but accepts a custom set (e.g. for the mentor shell).
class AppBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<NavDestination> destinations;

  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.destinations = kNavDestinations,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16.w, 0.h, 16.w, 12.h),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28.r),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 9.h),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(28.r),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.9),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.10),
                    blurRadius: 30,
                    offset: const Offset(0, 14),
                  ),
                  BoxShadow(
                    color: const Color(0xFF1E293B).withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: List.generate(destinations.length, (i) {
                  return Expanded(
                    child: _NavItem(
                      dest: destinations[i],
                      selected: i == currentIndex,
                      onTap: () => onTap(i),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final NavDestination dest;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.dest,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(vertical: 11.h),
        margin: EdgeInsets.symmetric(horizontal: 3.w),
        decoration: BoxDecoration(
          gradient: selected ? AppColors.brandGradient : null,
          borderRadius: BorderRadius.circular(18.r),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: selected ? 1.0 : 0.92,
              duration: const Duration(milliseconds: 280),
              curve: Curves.easeOutBack,
              child: Icon(
                selected ? dest.activeIcon : dest.icon,
                size: 22.sp,
                color: selected ? Colors.white : AppColors.textMuted,
              ),
            ),
            // Reveal the label only for the selected item. Flexible (loose
            // fit) keeps short labels centred with the icon, and lets a longer
            // label (e.g. "Bookings") clip/ellipsize instead of overflowing.
            Flexible(
              child: AnimatedSize(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOut,
                child: selected
                    ? Padding(
                        padding: EdgeInsets.only(left: 7.w),
                        child: Text(
                          dest.label,
                          maxLines: 1,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12.5.sp,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
