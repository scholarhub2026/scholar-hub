import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/booking_draft.dart';
import '../../data/models/mentor.dart';
import '../../data/services/booking_service.dart';
import '../../state/auth/auth_cubit.dart';
import '../../widgets/app_snackbar.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/primary_button.dart';
import 'widgets/booking_progress.dart';
import 'widgets/booking_confirmation.dart';
import 'widgets/booking_plan_step.dart';
import 'widgets/booking_review_step.dart';

class BookingScreen extends StatefulWidget {
  final Mentor mentor;

  const BookingScreen({super.key, required this.mentor});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  static const _fallbackStudentId = '000000000000000000000000';

  final BookingService _service = BookingService();
  late final BookingDraft _draft = BookingDraft(widget.mentor);

  int _step = 0;
  bool _submitting = false;
  String? _bookingId;

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
    if (_step == 1 && !_draft.isStepTwoValid) {
      AppSnackbar.error(context, 'Please fill in your name, email and phone.');
      return;
    }
    if (_step == 2) {
      _submit();
      return;
    }
    setState(() => _step++);
  }

  /// Tells the user exactly which booking selection is still missing.
  String _stepOneHint() {
    if (_draft.syllabus == null) return 'Please select a syllabus.';
    if (_draft.selectedClass == null) return 'Please select a class.';
    if (_draft.bookingType == null) {
      return 'Scroll down and choose a booking type to continue.';
    }
    if (_draft.requiresSubjects && _draft.selectedSubjectIds.isEmpty) {
      return _draft.classSubjects.isEmpty
          ? 'This class has no individual subjects — choose “Full Class”.'
          : 'Please select at least one subject.';
    }
    return 'Please complete your booking selection.';
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
      final user = context.read<AuthCubit>().state.user;
      final studentId = user?.id.isNotEmpty == true
          ? user!.id
          : _fallbackStudentId;

      _bookingId = await _service.createBooking(_draft, studentId: studentId);

      // Try to generate a Razorpay payment link and open it.
      String? paymentUrl;
      try {
        paymentUrl = await _service.createPaymentLink(
          amount: _draft.totalAmount,
          name: _draft.studentName,
          email: _draft.email,
          contact: _draft.phone,
          orderId: _bookingId,
        );
      } catch (_) {
        // Payment link is best-effort; the booking is already recorded.
      }

      if (!mounted) return;
      setState(() {
        _submitting = false;
        _step = 3;
      });

      if (paymentUrl != null && paymentUrl.isNotEmpty) {
        await launchUrl(
          Uri.parse(paymentUrl),
          mode: LaunchMode.externalApplication,
        );
      }
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
        title: Text(_step == 3 ? 'Confirmation' : 'Book a Session'),
      ),
      body: Column(
        children: [
          if (_step < 3) BookingProgress(currentStep: _step),
          Expanded(child: _buildStep()),
          if (_step < 3) _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return BookingPlanStep(
          draft: _draft,
          onChanged: () => setState(() {}),
        );
      case 1:
        return _buildDetailsStep();
      case 2:
        return BookingReviewStep(draft: _draft);
      default:
        return BookingConfirmation(
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
          'We’ll use this to confirm the session and share updates.',
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
          label: 'Message for Mentor (optional)',
          hint: 'Tell the mentor about your goals and focus areas…',
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
                label: isLast
                    ? 'Pay ${Formatters.rupeesPlain(_draft.totalAmount)}'
                    : 'Continue',
                icon: isLast ? LucideIcons.creditCard : LucideIcons.arrowRight,
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
