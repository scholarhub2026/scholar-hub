import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_content.dart';
import '../../core/theme/app_colors.dart';
import 'info_content.dart';

export 'info_content.dart' show InfoPage;

class InfoScreen extends StatelessWidget {
  final InfoPage page;

  const InfoScreen({super.key, required this.page});

  @override
  Widget build(BuildContext context) {
    final data = kInfoPages[page]!;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          _Header(title: data.title),
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(20.w, 22.h, 20.w, 36.h),
              children: [
                for (var i = 0; i < data.blocks.length; i++)
                  _BlockCard(block: data.blocks[i], lead: i == 0),
                if (page == InfoPage.contact)
                  const _ContactActions()
                else
                  const _NeedHelp(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String title;

  const _Header({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(26.r)),
      ),
      child: SafeArea(
        bottom: false,
        child: AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle.light,
          child: Padding(
            padding: EdgeInsets.fromLTRB(10.w, 8.h, 16.w, 18.h),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    height: 40.h,
                    width: 40.w,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(13.r),
                    ),
                    child: Icon(LucideIcons.arrowLeft,
                        color: Colors.white, size: 20.sp),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 21.sp,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BlockCard extends StatelessWidget {
  final InfoBlock block;
  final bool lead;

  const _BlockCard({required this.block, required this.lead});

  @override
  Widget build(BuildContext context) {
    // A heading-less opening block reads as a highlighted lead paragraph.
    if (block.heading == null && lead) {
      return Container(
        margin: EdgeInsets.only(bottom: 16.h),
        padding: EdgeInsets.all(18.r),
        decoration: BoxDecoration(
          color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.12)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final p in block.paragraphs)
              Padding(
                padding: EdgeInsets.only(
                    bottom: p == block.paragraphs.last ? 0.h : 10.h),
                child: Text(
                  p,
                  style: TextStyle(
                    fontSize: 14.5.sp,
                    height: 1.55,
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
          ],
        ),
      );
    }

    return Container(
      margin: EdgeInsets.only(bottom: 14.h),
      padding: EdgeInsets.all(18.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (block.heading != null) ...[
            Row(
              children: [
                Container(
                  height: 20.h,
                  width: 4.w,
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(2.r),
                  ),
                ),
                SizedBox(width: 10.w),
                Expanded(
                  child: Text(
                    block.heading!,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16.5.sp,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),
          ],
          for (final p in block.paragraphs)
            Padding(
              padding: EdgeInsets.only(bottom: 10.h),
              child: Text(
                p,
                style: TextStyle(
                  fontSize: 14.sp,
                  height: 1.55,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          for (final b in block.bullets)
            Padding(
              padding: EdgeInsets.only(bottom: 11.h),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(LucideIcons.checkCircle2,
                      size: 18.sp, color: AppColors.primary),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: Text(
                      b,
                      style: TextStyle(
                        fontSize: 14.sp,
                        height: 1.45,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _ContactActions extends StatelessWidget {
  const _ContactActions();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _ContactTile(
          icon: LucideIcons.mail,
          label: 'Email us',
          value: AppContent.email,
          color: AppColors.primary,
          uri: 'mailto:${AppContent.email}',
        ),
        SizedBox(height: 12.h),
        _ContactTile(
          icon: LucideIcons.phone,
          label: 'Call us',
          value: '${AppContent.phone1} · ${AppContent.phone2}',
          color: AppColors.success,
          uri: 'tel:${AppContent.phone1}',
        ),
        SizedBox(height: 12.h),
        _ContactTile(
          icon: LucideIcons.globe,
          label: 'Website',
          value: AppContent.website,
          color: AppColors.violet,
          uri: AppContent.websiteUrl,
        ),
      ],
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final String uri;

  const _ContactTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.uri,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(18.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(18.r),
        onTap: () =>
            launchUrl(Uri.parse(uri), mode: LaunchMode.externalApplication),
        child: Container(
          padding: EdgeInsets.all(14.r),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18.r),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                height: 46.h,
                width: 46.w,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14.r),
                ),
                child: Icon(icon, color: color, size: 21.sp),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppColors.textMuted,
                      ),
                    ),
                    Text(
                      value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        fontSize: 14.sp,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.arrowUpRight, color: color, size: 20.sp),
            ],
          ),
        ),
      ),
    );
  }
}

class _NeedHelp extends StatelessWidget {
  const _NeedHelp();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(top: 6.h),
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(22.r),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Still have questions?',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16.sp,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  'We’re happy to help — reach out anytime.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 13.sp,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 12.w),
          GestureDetector(
            onTap: () => launchUrl(
              Uri.parse('mailto:${AppContent.email}'),
              mode: LaunchMode.externalApplication,
            ),
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14.r),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.mail, color: AppColors.primary, size: 16.sp),
                  SizedBox(width: 7.w),
                  Text(
                    'Contact',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13.sp,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
