import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/di/service_locator.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/mentor.dart';
import '../../data/services/enquiry_service.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/primary_button.dart';
import 'enquiry_draft.dart';
import 'widgets/enquiry_plan_step.dart';
import 'widgets/enquiry_review_step.dart';
import 'widgets/enquiry_success.dart';

/// Student-facing enquiry flow: pick a mentor's class + type and send a lead.
/// No slots and no payment — the admin follows up offline.
class EnquiryScreen extends StatefulWidget {
  final Mentor mentor;

  const EnquiryScreen({super.key, required this.mentor});

  @override
  State<EnquiryScreen> createState() => _EnquiryScreenState();
}

class _EnquiryScreenState extends State<EnquiryScreen> {
  final EnquiryService _service = sl<EnquiryService>();
  late final EnquiryDraft _draft = EnquiryDraft(widget.mentor);

  int _step = 0;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    // Prefill from the logged-in user, if any.
    final user = context.read<AuthCubit>().state.user;
    if (user != null) {
      _draft.studentName = user.fullName;
      _draft.email = user.email;
    }
  }

  void _next() {
    FocusScope.of(context).unfocus();
    if (_step == 0 && !_draft.isStepOneValid) {
      AppSnackbar.error(context, _stepOneHint());
      return;
    }
    if (_step == 1 && !_draft.isDetailsValid) {
      AppSnackbar.error(context, 'Please fill in your name, email and phone.');
      return;
    }
    if (_step == 2) {
      _submit();
      return;
    }
    setState(() => _step++);
  }

  /// Tells the user exactly which enquiry selection is still missing.
  String _stepOneHint() {
    if (_draft.syllabus == null) return 'Please select a syllabus.';
    if (_draft.selectedClass == null) return 'Please select a class.';
    if (_draft.enquiryType == null) {
      return 'Choose an enquiry type to continue.';
    }
    if (_draft.requiresSubjects && _draft.selectedSubjectIds.isEmpty) {
      return _draft.classSubjects.isEmpty
          ? 'This class has no subjects — choose a demo class instead.'
          : 'Please select at least one subject.';
    }
    return 'Please complete your enquiry selection.';
  }

  void _back() {
    if (_step == 0) {
      Navigator.pop(context);
      return;
    }
    setState(() => _step--);
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await _service.submitEnquiry(
        studentName: _draft.studentName.trim(),
        email: _draft.email.trim(),
        phone: _draft.phone.trim(),
        mentorId: _draft.mentor.id,
        enquiryType: _draft.enquiryType!,
        selectedSyllabus: _draft.syllabus,
        classId: _draft.selectedClass?.id,
        className: _draft.selectedClass?.className,
        subjects: _draft.subjectPayload,
        message: _draft.message.trim().isEmpty ? null : _draft.message.trim(),
      );

      if (!mounted) return;
      setState(() {
        _submitting = false;
        _step = 3;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      AppSnackbar.error(context, e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: _back,
        ),
        title: Text(_step == 3 ? 'Enquiry Sent' : 'Enquire Now'),
      ),
      body: Column(
        children: [
          Expanded(child: _buildStep()),
          if (_step < 3) _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return EnquiryPlanStep(
          draft: _draft,
          onChanged: () => setState(() {}),
        );
      case 1:
        return _buildDetailsStep();
      case 2:
        return EnquiryReviewStep(draft: _draft);
      default:
        return EnquirySuccess(
          draft: _draft,
          onDone: () => Navigator.pop(context, true),
        );
    }
  }

  Widget _buildDetailsStep() {
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 24.h),
      children: [
        Text(
          'Your details',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 4.h),
        Text(
          'We\'ll use this to contact you about your enquiry.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5.sp),
        ),
        SizedBox(height: 20.h),
        AppTextField(
          label: 'Student Name',
          hint: 'Full name',
          prefixIcon: LucideIcons.user,
          initialValue: _draft.studentName,
          onChanged: (v) => _draft.studentName = v,
        ),
        SizedBox(height: 16.h),
        AppTextField(
          label: 'Email Address',
          hint: 'email@example.com',
          prefixIcon: LucideIcons.mail,
          keyboardType: TextInputType.emailAddress,
          initialValue: _draft.email,
          onChanged: (v) => _draft.email = v,
        ),
        SizedBox(height: 16.h),
        AppTextField(
          label: 'Phone Number',
          hint: 'Your phone number',
          prefixIcon: LucideIcons.phone,
          keyboardType: TextInputType.phone,
          initialValue: _draft.phone,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]')),
          ],
          onChanged: (v) => _draft.phone = v,
        ),
        SizedBox(height: 16.h),
        AppTextField(
          label: 'Message (optional)',
          hint: 'Tell us about your goals and focus areas…',
          prefixIcon: LucideIcons.messageSquare,
          maxLines: 4,
          textInputAction: TextInputAction.newline,
          initialValue: _draft.message,
          onChanged: (v) => _draft.message = v,
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    final isLast = _step == 2;
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 16.h),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (_step > 0) ...[
              Expanded(
                child: SecondaryButton(
                  label: 'Back',
                  onPressed: _submitting ? null : _back,
                ),
              ),
              SizedBox(width: 12.w),
            ],
            Expanded(
              flex: 2,
              child: PrimaryButton(
                label: isLast ? 'Enquire Now' : 'Continue',
                icon: isLast ? LucideIcons.send : LucideIcons.arrowRight,
                loading: _submitting,
                onPressed: _submitting ? null : _next,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
