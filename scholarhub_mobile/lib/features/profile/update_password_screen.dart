import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/network/api_client.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/primary_button.dart';
import '../auth/widgets/auth_scaffold.dart';

class UpdatePasswordScreen extends StatefulWidget {
  const UpdatePasswordScreen({super.key});

  @override
  State<UpdatePasswordScreen> createState() => _UpdatePasswordScreenState();
}

class _UpdatePasswordScreenState extends State<UpdatePasswordScreen> {
  String _password = '';
  String _confirm = '';
  bool _loading = false;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_password.length < 6) {
      AppSnackbar.error(context, 'Password must be at least 6 characters.');
      return;
    }
    if (_password != _confirm) {
      AppSnackbar.error(context, 'Passwords do not match.');
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<AuthCubit>().updatePassword(
            password: _password,
            confirmPassword: _confirm,
          );
      if (!mounted) return;
      AppSnackbar.success(context, 'Password updated successfully.');
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppSnackbar.error(context, e.message);
    } catch (_) {
      if (!mounted) return;
      AppSnackbar.error(context, 'Unable to update password.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Update Password',
      subtitle: 'Choose a new password for your account',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PasswordField(
            label: 'New Password',
            hint: 'Enter a new password',
            onChanged: (v) => _password = v,
          ),
          SizedBox(height: 18.h),
          PasswordField(
            label: 'Confirm Password',
            hint: 'Re-enter the new password',
            textInputAction: TextInputAction.done,
            onChanged: (v) => _confirm = v,
          ),
          SizedBox(height: 28.h),
          PrimaryButton(
            label: 'Save Password',
            icon: LucideIcons.keyRound,
            loading: _loading,
            onPressed: _loading ? null : _submit,
          ),
        ],
      ),
    );
  }
}
