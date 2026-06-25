import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_content.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/primary_button.dart';

/// Collected lead-form values.
class LeadFormData {
  String name = '';
  String email = '';
  String phone = '';
  String place = '';
  String subject = '';
  String message = '';
}

/// Reusable bottom-sheet form used for both "Enquiry Now" and "Become a
/// Mentor". Shows a success state on submit.
class LeadFormSheet extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool showSubject;
  final String messageHint;
  final Future<void> Function(LeadFormData data) onSubmit;

  const LeadFormSheet({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onSubmit,
    this.showSubject = false,
    this.messageHint = 'Your message…',
  });

  @override
  State<LeadFormSheet> createState() => _LeadFormSheetState();
}

class _LeadFormSheetState extends State<LeadFormSheet> {
  final LeadFormData _data = LeadFormData();
  bool _loading = false;
  bool _done = false;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_data.name.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter your name.');
      return;
    }
    if (!_data.email.contains('@')) {
      AppSnackbar.error(context, 'Please enter a valid email.');
      return;
    }
    if (_data.phone.trim().length < 7) {
      AppSnackbar.error(context, 'Please enter a valid phone number.');
      return;
    }
    if (_data.place.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter your place.');
      return;
    }
    if (widget.showSubject && _data.subject.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter a subject or class.');
      return;
    }
    if (_data.message.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter a message.');
      return;
    }

    setState(() => _loading = true);
    try {
      await widget.onSubmit(_data);
      if (!mounted) return;
      setState(() {
        _loading = false;
        _done = true;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      AppSnackbar.error(context, e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
      AppSnackbar.error(context, 'Something went wrong. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
        ),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: _done ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _grabber() => Center(
        child: Container(
          margin: EdgeInsets.only(top: 12.h, bottom: 4.h),
          height: 5.h,
          width: 44.w,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(3.r),
          ),
        ),
      );

  Widget _buildForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _grabber(),
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 28.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      height: 46.h,
                      width: 46.w,
                      decoration: BoxDecoration(
                        gradient: AppColors.brandGradient,
                        borderRadius: BorderRadius.circular(14.r),
                      ),
                      child: Icon(widget.icon, color: Colors.white, size: 22.sp),
                    ),
                    SizedBox(width: 14.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.title,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 19.sp,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            widget.subtitle,
                            style: TextStyle(
                              fontSize: 12.5.sp,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                SizedBox(height: 18.h),
                AppTextField(
                  label: 'Name',
                  hint: 'Enter your name',
                  prefixIcon: LucideIcons.user,
                  onChanged: (v) => _data.name = v,
                ),
                SizedBox(height: 14.h),
                AppTextField(
                  label: 'Email',
                  hint: 'Enter your email',
                  prefixIcon: LucideIcons.mail,
                  keyboardType: TextInputType.emailAddress,
                  onChanged: (v) => _data.email = v,
                ),
                SizedBox(height: 14.h),
                AppTextField(
                  label: 'Phone',
                  hint: 'Enter your phone',
                  prefixIcon: LucideIcons.phone,
                  keyboardType: TextInputType.phone,
                  onChanged: (v) => _data.phone = v,
                ),
                SizedBox(height: 14.h),
                AppTextField(
                  label: 'Place',
                  hint: 'Enter your place',
                  prefixIcon: LucideIcons.mapPin,
                  onChanged: (v) => _data.place = v,
                ),
                if (widget.showSubject) ...[
                  SizedBox(height: 14.h),
                  AppTextField(
                    label: 'Subject / Class',
                    hint: 'e.g. Class 10 Maths',
                    prefixIcon: LucideIcons.bookOpen,
                    onChanged: (v) => _data.subject = v,
                  ),
                ],
                SizedBox(height: 14.h),
                AppTextField(
                  label: 'Message',
                  hint: widget.messageHint,
                  prefixIcon: LucideIcons.messageSquare,
                  maxLines: 3,
                  textInputAction: TextInputAction.newline,
                  onChanged: (v) => _data.message = v,
                ),
                SizedBox(height: 24.h),
                PrimaryButton(
                  label: 'Submit',
                  icon: LucideIcons.send,
                  loading: _loading,
                  onPressed: _loading ? null : _submit,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return Padding(
      padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 32.h),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _grabber(),
          SizedBox(height: 16.h),
          Container(
            height: 96.h,
            width: 96.w,
            decoration: const BoxDecoration(
              color: AppColors.successSoft,
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.partyPopper,
                color: AppColors.success, size: 46.sp),
          ).animate().scale(
                duration: 450.ms,
                curve: Curves.easeOutBack,
                begin: const Offset(0.5, 0.5),
              ),
          SizedBox(height: 22.h),
          Text(
            'Thank You!',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8.h),
          const Text(
            'Your request has been successfully received. '
            'We’re excited to connect with you soon!',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, height: 1.5),
          ),
          SizedBox(height: 22.h),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              _contactPill(LucideIcons.mail, AppContent.email,
                  'mailto:${AppContent.email}'),
              _contactPill(LucideIcons.phone, AppContent.phone1,
                  'tel:${AppContent.phone1}'),
            ],
          ),
          SizedBox(height: 24.h),
          PrimaryButton(
            label: 'Done',
            icon: LucideIcons.check,
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _contactPill(IconData icon, String label, String uri) {
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse(uri)),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 9.h),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(30.r),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15.sp, color: AppColors.primary),
            SizedBox(width: 8.w),
            Text(
              label,
              style: TextStyle(
                color: AppColors.primaryDark,
                fontWeight: FontWeight.w600,
                fontSize: 13.sp,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
