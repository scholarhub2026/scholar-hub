import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/primary_button.dart';
import 'login_screen.dart';
import 'widgets/auth_scaffold.dart';

class OtpScreen extends StatefulWidget {
  final String userId;
  final String email;

  const OtpScreen({super.key, required this.userId, required this.email});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final otp = _controller.text.trim();
    if (otp.length < 4) {
      AppSnackbar.error(context, 'Enter the OTP sent to your email.');
      return;
    }
    setState(() => _loading = true);
    try {
      await context
          .read<AuthCubit>()
          .verifyOtp(userId: widget.userId, otp: otp);
      if (!mounted) return;
      AppSnackbar.success(context, 'Email verified! Please sign in.');
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => route.isFirst,
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      AppSnackbar.error(context, e.message);
    } catch (_) {
      if (!mounted) return;
      AppSnackbar.error(context, 'Invalid or expired OTP.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Verify Email',
      subtitle: 'Enter the 6-digit code we sent you',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: EdgeInsets.all(16.r),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(16.r),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.mail, color: AppColors.primary),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    'We sent a verification code to ${widget.email}',
                    style: TextStyle(
                      color: AppColors.primaryDark,
                      fontSize: 13.sp,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 24.h),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: TextStyle(
              fontSize: 28.sp,
              fontWeight: FontWeight.w800,
              letterSpacing: 14,
              color: AppColors.textPrimary,
            ),
            decoration: const InputDecoration(
              counterText: '',
              hintText: '••••••',
              hintStyle: TextStyle(letterSpacing: 14, color: AppColors.textMuted),
            ),
          ),
          SizedBox(height: 24.h),
          PrimaryButton(
            label: 'Verify',
            icon: LucideIcons.shieldCheck,
            loading: _loading,
            onPressed: _loading ? null : _verify,
          ),
          SizedBox(height: 16.h),
          Center(
            child: TextButton(
              onPressed: () => Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => route.isFirst,
              ),
              child: const Text('Skip for now'),
            ),
          ),
        ],
      ),
    );
  }
}
