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
import 'signup_screen.dart';
import 'widgets/auth_scaffold.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _email = '';
  String _password = '';
  bool _loading = false;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_email.trim().isEmpty || !_email.contains('@')) {
      AppSnackbar.error(context, 'Please enter a valid email address.');
      return;
    }
    if (_password.isEmpty) {
      AppSnackbar.error(context, 'Please enter your password.');
      return;
    }
    setState(() => _loading = true);
    try {
      final user = await context
          .read<AuthCubit>()
          .login(email: _email.trim(), password: _password);
      if (!mounted) return;
      AppSnackbar.success(context, 'Welcome back, ${user.firstName}!');
      // Admins and mentors land on a different shell — pop back to the root
      // gate so it can rebuild into the correct (admin/mentor) experience.
      // Students simply return to where they were browsing.
      if (user.isAdmin || user.isTutor) {
        Navigator.popUntil(context, (route) => route.isFirst);
      } else {
        Navigator.pop(context);
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      AppSnackbar.error(context, e.message);
    } catch (_) {
      if (!mounted) return;
      AppSnackbar.error(context, 'Unable to sign in. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Welcome Back',
      subtitle: 'Sign in to your Scholar Hub account',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppTextField(
            label: 'Email',
            hint: 'Enter your email',
            prefixIcon: LucideIcons.mail,
            keyboardType: TextInputType.emailAddress,
            onChanged: (v) => _email = v,
          ),
          SizedBox(height: 18.h),
          PasswordField(
            label: 'Password',
            textInputAction: TextInputAction.done,
            onChanged: (v) => _password = v,
          ),
          SizedBox(height: 28.h),
          PrimaryButton(
            label: 'Sign In',
            icon: LucideIcons.logIn,
            loading: _loading,
            onPressed: _loading ? null : _submit,
          ),
          SizedBox(height: 20.h),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Text(
                "Don't have an account? ",
                style: TextStyle(color: AppColors.textSecondary),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (_) => const SignupScreen()),
                  );
                },
                child: const Text(
                  'Sign up',
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
