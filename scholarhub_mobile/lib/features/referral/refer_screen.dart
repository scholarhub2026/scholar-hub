import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/referral.dart';
import '../../state/auth/auth_cubit.dart';
import '../../state/view_status.dart';
import '../../widgets/state_views.dart';
import 'referral_cubit.dart';

/// Refer & Earn — shows the user's shareable code, reward balance and the
/// friends who've joined through it.
class ReferScreen extends StatelessWidget {
  const ReferScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = context.read<AuthCubit>().state.user?.id ?? '';
    return BlocProvider(
      create: (_) => ReferralCubit()..load(userId),
      child: _ReferView(userId: userId),
    );
  }
}

class _ReferView extends StatelessWidget {
  final String userId;
  const _ReferView({required this.userId});

  String _shareMessage(String code) =>
      'Join me on Scholar Hub — book expert mentors for any subject. '
      'Use my code $code when you sign up. https://www.scholarhub.live/';

  void _copyCode(BuildContext context, String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Referral code copied!')),
    );
  }

  void _share(String code) {
    Share.share(_shareMessage(code), subject: 'Join me on Scholar Hub');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Refer & Earn'),
        titleTextStyle: TextStyle(
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 18.sp,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: BlocBuilder<ReferralCubit, ReferralState>(
        builder: (context, state) {
          if (state.status.isLoading || state.status.isInitial) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }
          if (state.status.isFailure || state.info == null) {
            return ErrorStateView(
              message: state.error ?? 'Unable to load your referral details.',
              onRetry: () => context.read<ReferralCubit>().load(userId),
            );
          }
          return _content(context, state.info!);
        },
      ),
    );
  }

  Widget _content(BuildContext context, ReferralInfo info) {
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 40.h),
      children: [
        _rewardHero(info),
        SizedBox(height: 20.h),
        _codeCard(context, info.code),
        SizedBox(height: 20.h),
        _statsRow(info),
        SizedBox(height: 24.h),
        _howItWorks(),
        if (info.referredUsers.isNotEmpty) ...[
          SizedBox(height: 24.h),
          Text(
            'Friends you referred',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16.sp),
          ),
          SizedBox(height: 12.h),
          ...info.referredUsers.map(_referredTile),
        ],
      ],
    );
  }

  Widget _rewardHero(ReferralInfo info) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(22.r),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.gift, color: Colors.white, size: 22.sp),
              SizedBox(width: 8.w),
              Text(
                'Your rewards',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Text(
            Formatters.rupeesPlain(info.rewardBalance),
            style: TextStyle(
              color: Colors.white,
              fontSize: 40.sp,
              fontWeight: FontWeight.w900,
              height: 1,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'Invite friends and earn when they complete their first booking.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 13.sp,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _codeCard(BuildContext context, String code) {
    return Container(
      padding: EdgeInsets.all(18.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your referral code',
            style: TextStyle(fontSize: 12.5.sp, color: AppColors.textMuted),
          ),
          SizedBox(height: 10.h),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: EdgeInsets.symmetric(vertical: 14.h, horizontal: 16.w),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(12.r),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Text(
                    code.isEmpty ? '—' : code,
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 22.sp,
                      letterSpacing: 3,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 10.w),
              _iconAction(LucideIcons.copy, () => _copyCode(context, code)),
            ],
          ),
          SizedBox(height: 14.h),
          SizedBox(
            width: double.infinity,
            height: 50.h,
            child: ElevatedButton.icon(
              onPressed: code.isEmpty ? null : () => _share(code),
              icon: Icon(LucideIcons.share2, size: 18.sp),
              label: Text(
                'Share invite',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14.r),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconAction(IconData icon, VoidCallback onTap) {
    return Material(
      color: AppColors.primaryLight,
      borderRadius: BorderRadius.circular(12.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(12.r),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.all(14.r),
          child: Icon(icon, size: 20.sp, color: AppColors.primary),
        ),
      ),
    );
  }

  Widget _statsRow(ReferralInfo info) {
    return Row(
      children: [
        Expanded(
          child: _statCard(
            LucideIcons.users,
            '${info.count}',
            'Friends joined',
          ),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: _statCard(
            LucideIcons.wallet,
            Formatters.rupeesPlain(info.rewardBalance),
            'Total earned',
          ),
        ),
      ],
    );
  }

  Widget _statCard(IconData icon, String value, String label) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 12.w),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary, size: 22.sp),
          SizedBox(height: 10.h),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17.sp),
          ),
          SizedBox(height: 2.h),
          Text(
            label,
            style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _howItWorks() {
    const steps = [
      (LucideIcons.share2, 'Share your code', 'Send your referral code to friends and family.'),
      (LucideIcons.userPlus, 'They sign up', 'Your friend creates an account with your code.'),
      (LucideIcons.badgeCheck, 'You both earn', 'Earn rewards once they complete their first booking.'),
    ];
    return Container(
      padding: EdgeInsets.all(18.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'How it works',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16.sp),
          ),
          SizedBox(height: 14.h),
          for (var i = 0; i < steps.length; i++) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 38.h,
                  width: 38.w,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(steps[i].$1, size: 19.sp, color: AppColors.primary),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        steps[i].$2,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      SizedBox(height: 2.h),
                      Text(
                        steps[i].$3,
                        style: TextStyle(
                          fontSize: 12.5.sp,
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (i < steps.length - 1) SizedBox(height: 16.h),
          ],
        ],
      ),
    );
  }

  Widget _referredTile(ReferredUser user) {
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            height: 40.h,
            width: 40.w,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.successSoft,
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.check, size: 18.sp, color: AppColors.success),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name.isEmpty ? user.email : user.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (user.email.isNotEmpty)
                  Text(
                    user.email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12.sp, color: AppColors.textMuted),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
