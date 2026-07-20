import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/navigation/app_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../state/auth/auth_cubit.dart';
import '../../state/auth/auth_state.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/network_avatar.dart';
import '../../widgets/primary_button.dart';
import '../info/info_content.dart';
import '../student/invoices/student_invoices_screen.dart';
import 'update_password_screen.dart';

class ProfileScreen extends StatelessWidget {
  final VoidCallback onBrowseMentors;

  const ProfileScreen({super.key, required this.onBrowseMentors});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthCubit>().state;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profile'),
        automaticallyImplyLeading: false,
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 120.h),
        children: [
          auth.isAuthenticated
              ? _buildUserHeader(context, auth)
              : _buildGuestHeader(context),
          SizedBox(height: 24.h),
          _sectionLabel('Get involved'),
          _MenuTile(
            icon: LucideIcons.search,
            title: 'Find a Mentor',
            subtitle: 'Browse verified experts',
            onTap: onBrowseMentors,
          ),
          _MenuTile(
            icon: LucideIcons.graduationCap,
            title: 'Become a Mentor',
            subtitle: 'Share your expertise & earn',
            onTap: () => AppNavigator.openBecomeMentor(context),
          ),
          _MenuTile(
            icon: LucideIcons.send,
            title: 'Make an Enquiry',
            subtitle: 'Tell us what you need',
            onTap: () => AppNavigator.openEnquiry(context),
          ),
          SizedBox(height: 8.h),
          _sectionLabel('About'),
          _MenuTile(
            icon: LucideIcons.info,
            title: 'About Scholar Hub',
            onTap: () => AppNavigator.toInfo(context, InfoPage.about),
          ),
          _MenuTile(
            icon: LucideIcons.phone,
            title: 'Contact Us',
            onTap: () => AppNavigator.toInfo(context, InfoPage.contact),
          ),
          _MenuTile(
            icon: LucideIcons.fileText,
            title: 'Terms of Service',
            onTap: () => AppNavigator.toInfo(context, InfoPage.terms),
          ),
          _MenuTile(
            icon: LucideIcons.shieldCheck,
            title: 'Privacy Policy',
            onTap: () => AppNavigator.toInfo(context, InfoPage.privacy),
          ),
          _MenuTile(
            icon: LucideIcons.wallet,
            title: 'Cancellations & Refunds',
            onTap: () => AppNavigator.toInfo(context, InfoPage.refund),
          ),
          if (auth.isAuthenticated) ...[
            SizedBox(height: 8.h),
            _sectionLabel('Account'),
            _MenuTile(
              icon: LucideIcons.receipt,
              title: 'My Fees',
              subtitle: 'Invoices & payment receipts',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const StudentInvoicesScreen(),
                ),
              ),
            ),
            _MenuTile(
              icon: LucideIcons.keyRound,
              title: 'Update Password',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const UpdatePasswordScreen(),
                ),
              ),
            ),
            _MenuTile(
              icon: LucideIcons.logOut,
              title: 'Sign Out',
              danger: true,
              onTap: () => _confirmLogout(context),
            ),
          ],
          SizedBox(height: 28.h),
          Center(child: AppLogo(height: 40.h)),
          SizedBox(height: 6.h),
          Center(
            child: Text(
              'v1.0.0 · Made for learners',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12.sp),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserHeader(BuildContext context, AuthState auth) {
    final user = auth.user!;
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(26.r),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            padding: EdgeInsets.all(3.r),
            child: NetworkAvatar(
              imageUrl: null,
              initials: Formatters.initials(user.firstName, user.lastName),
              size: 58.r,
            ),
          ),
          SizedBox(width: 16.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.fullName.isEmpty ? 'Scholar' : user.fullName,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 19.sp,
                  ),
                ),
                SizedBox(height: 2.h),
                Text(
                  user.email,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 13.sp,
                  ),
                ),
                SizedBox(height: 8.h),
                Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Text(
                    user.role,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 11.sp,
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

  Widget _buildGuestHeader(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(22.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(26.r),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            height: 64.h,
            width: 64.w,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Icon(LucideIcons.userCircle2,
                color: AppColors.primary, size: 32.sp),
          ),
          SizedBox(height: 16.h),
          Text(
            'Welcome to Scholar Hub',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18.sp,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            'Sign in to manage bookings and your account.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
          ),
          SizedBox(height: 18.h),
          Row(
            children: [
              Expanded(
                child: PrimaryButton(
                  label: 'Sign In',
                  icon: LucideIcons.logIn,
                  onPressed: () => AppNavigator.toLogin(context),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: SecondaryButton(
                  label: 'Sign Up',
                  onPressed: () => AppNavigator.toSignup(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) => Padding(
        padding: EdgeInsets.fromLTRB(4.w, 8.h, 0, 10.h),
        child: Text(
          text.toUpperCase(),
          style: TextStyle(
            color: AppColors.textMuted,
            fontWeight: FontWeight.w700,
            fontSize: 11.5.sp,
            letterSpacing: 1.2,
          ),
        ),
      );

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22.r),
        ),
        title: const Text('Sign out?'),
        content: const Text('You can always sign back in anytime.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<AuthCubit>().logout();
              AppSnackbar.info(context, 'You have been logged out.');
            },
            child: const Text(
              'Sign Out',
              style: TextStyle(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final bool danger;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = danger ? AppColors.danger : AppColors.primary;
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        child: InkWell(
          borderRadius: BorderRadius.circular(18.r),
          onTap: onTap,
          child: Padding(
            padding: EdgeInsets.all(14.r),
            child: Row(
              children: [
                Container(
                  height: 42.h,
                  width: 42.w,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(13.r),
                  ),
                  child: Icon(icon, color: color, size: 20.sp),
                ),
                SizedBox(width: 14.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14.5.sp,
                          color: danger
                              ? AppColors.danger
                              : AppColors.textPrimary,
                        ),
                      ),
                      if (subtitle != null)
                        Text(
                          subtitle!,
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: AppColors.textMuted,
                          ),
                        ),
                    ],
                  ),
                ),
                Icon(LucideIcons.chevronRight,
                    color: AppColors.textMuted, size: 18.sp),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
