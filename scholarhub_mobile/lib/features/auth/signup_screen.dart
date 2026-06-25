import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/primary_button.dart';
import 'login_screen.dart';
import 'otp_screen.dart';
import 'widgets/auth_scaffold.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  String _firstName = '';
  String _lastName = '';
  String _email = '';
  String _phone = '';
  String _password = '';
  String _confirm = '';
  bool _agree = false;
  bool _loading = false;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_firstName.trim().isEmpty || _lastName.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter your first and last name.');
      return;
    }
    if (!_email.contains('@')) {
      AppSnackbar.error(context, 'Please enter a valid email address.');
      return;
    }
    if (_phone.trim().length < 7) {
      AppSnackbar.error(context, 'Please enter a valid phone number.');
      return;
    }
    if (_password.length < 6) {
      AppSnackbar.error(context, 'Password must be at least 6 characters.');
      return;
    }
    if (_password != _confirm) {
      AppSnackbar.error(context, 'Passwords do not match.');
      return;
    }
    if (!_agree) {
      AppSnackbar.error(context, 'Please accept the terms and conditions.');
      return;
    }

    setState(() => _loading = true);
    try {
      final result = await context.read<AuthCubit>().signup(
            firstName: _firstName.trim(),
            lastName: _lastName.trim(),
            email: _email.trim(),
            phoneNumber: _phone.trim(),
            password: _password,
          );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => OtpScreen(userId: result.userId, email: _email.trim()),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      AppSnackbar.error(context, e.message);
    } catch (_) {
      if (!mounted) return;
      AppSnackbar.error(context, 'Unable to create your account.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Create an Account',
      subtitle: 'Join Scholar Hub and start your learning journey',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: AppTextField(
                  label: 'First Name',
                  hint: 'First name',
                  onChanged: (v) => _firstName = v,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: AppTextField(
                  label: 'Last Name',
                  hint: 'Last name',
                  onChanged: (v) => _lastName = v,
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          AppTextField(
            label: 'Email',
            hint: 'Enter your email',
            prefixIcon: LucideIcons.mail,
            keyboardType: TextInputType.emailAddress,
            onChanged: (v) => _email = v,
          ),
          SizedBox(height: 16.h),
          AppTextField(
            label: 'Phone Number',
            hint: 'Phone number',
            prefixIcon: LucideIcons.phone,
            keyboardType: TextInputType.phone,
            onChanged: (v) => _phone = v,
          ),
          SizedBox(height: 16.h),
          PasswordField(
            label: 'Password',
            hint: 'Create a password',
            onChanged: (v) => _password = v,
          ),
          SizedBox(height: 16.h),
          PasswordField(
            label: 'Confirm Password',
            hint: 'Re-enter your password',
            textInputAction: TextInputAction.done,
            onChanged: (v) => _confirm = v,
          ),
          SizedBox(height: 16.h),
          Row(
            children: [
              SizedBox(
                height: 24.h,
                width: 24.w,
                child: Checkbox(
                  value: _agree,
                  activeColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6.r),
                  ),
                  onChanged: (v) => setState(() => _agree = v ?? false),
                ),
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(
                  'I agree to the Terms of Service and Privacy Policy',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13.sp,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 22.h),
          PrimaryButton(
            label: 'Sign Up',
            icon: LucideIcons.userPlus,
            loading: _loading,
            onPressed: _loading ? null : _submit,
          ),
          SizedBox(height: 20.h),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Text(
                'Already have an account? ',
                style: TextStyle(color: AppColors.textSecondary),
              ),
              GestureDetector(
                onTap: () => Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                ),
                child: const Text(
                  'Sign in',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
