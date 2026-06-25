import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../widgets/primary_button.dart';

enum AuthIntent { signIn, signUp }

/// Bottom sheet shown when a signed-out user tries to do something that needs
/// an account (e.g. booking a session). Returns the chosen [AuthIntent], or
/// null if dismissed.
Future<AuthIntent?> showSignInPrompt(
  BuildContext context, {
  String title = 'Sign in to continue',
  String message =
      'Create an account or sign in to book a session and keep track of it in '
      'your dashboard.',
}) {
  return showModalBottomSheet<AuthIntent>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _SignInPromptSheet(title: title, message: message),
  );
}

class _SignInPromptSheet extends StatelessWidget {
  final String title;
  final String message;

  const _SignInPromptSheet({required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration:  BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
      ),
      padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 28.h),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 5.h,
            width: 44.w,
            margin: EdgeInsets.only(bottom: 22.h),
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(3.r),
            ),
          ),
          Container(
            height: 70.h,
            width: 70.w,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.circular(22.r),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Icon(LucideIcons.lock, color: Colors.white, size: 32.sp),
          ),
          SizedBox(height: 20.h),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8.h),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              height: 1.5,
              fontSize: 14.sp,
            ),
          ),
          SizedBox(height: 24.h),
          PrimaryButton(
            label: 'Sign In',
            icon: LucideIcons.logIn,
            onPressed: () => Navigator.pop(context, AuthIntent.signIn),
          ),
          SizedBox(height: 12.h),
          SecondaryButton(
            label: 'Create an account',
            onPressed: () => Navigator.pop(context, AuthIntent.signUp),
          ),
          SizedBox(height: 6.h),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Maybe later'),
          ),
        ],
      ),
    );
  }
}
