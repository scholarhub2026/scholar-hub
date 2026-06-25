import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/catalog.dart';
import '../../../data/models/mentor.dart';
import '../../../state/auth/auth_cubit.dart';
import '../../../state/view_status.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/primary_button.dart';
import '../../../widgets/state_views.dart';
import 'mentor_profile_cubit.dart';

const _qualifications = [
  'High School',
  'Bachelor',
  'Master',
  'PhD',
  'Diploma',
  'Certificate',
  'Other',
];

class MentorProfileScreen extends StatelessWidget {
  const MentorProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final mentorId = context.read<AuthCubit>().state.user?.id ?? '';
    return BlocProvider(
      create: (_) => MentorProfileCubit(mentorId)..load(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Complete your profile')),
        body: BlocBuilder<MentorProfileCubit, MentorProfileState>(
          builder: (context, state) {
            if (state.status == ViewStatus.loading ||
                state.status == ViewStatus.initial) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              );
            }
            if (state.status == ViewStatus.failure && state.mentor == null) {
              return ErrorStateView(
                message: state.error ?? 'Unable to load your profile.',
                onRetry: () => context.read<MentorProfileCubit>().load(),
              );
            }
            return _ProfileForm(
              mentor: state.mentor!,
              classes: state.classes,
            );
          },
        ),
      ),
    );
  }
}

class _ClassSel {
  bool selected = false;
  final TextEditingController price = TextEditingController();
  final Set<String> subjectIds = <String>{};
}

class _ProfileForm extends StatefulWidget {
  final Mentor mentor;
  final List<ClassItem> classes;
  const _ProfileForm({required this.mentor, required this.classes});

  @override
  State<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends State<_ProfileForm> {
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _phone;
  late final TextEditingController _location;
  late final TextEditingController _experience;
  late final TextEditingController _about;
  late final TextEditingController _bankAccount;
  late final TextEditingController _ifsc;
  late final TextEditingController _branch;
  late final TextEditingController _holder;
  late final TextEditingController _upi;

  String? _gender;
  String? _qualification;
  late final Map<String, _ClassSel> _classSel;

  // Classes the mentor already has that are no longer in the active catalog —
  // carried through verbatim so saving never wipes them (the backend $sets the
  // whole selected_class array).
  final List<Map<String, dynamic>> _orphanedClasses = [];
  // Mentor's previously-stored per-subject prices, keyed by classId/subjectId,
  // so a re-save preserves them instead of forcing the current catalog price.
  final Map<String, Map<String, num>> _storedSubjectPrice = {};

  @override
  void initState() {
    super.initState();
    final m = widget.mentor;
    _firstName = TextEditingController(text: m.firstName);
    _lastName = TextEditingController(text: m.lastName);
    _phone = TextEditingController(text: m.phoneNumber);
    _location = TextEditingController(text: m.location);
    _experience = TextEditingController(text: m.experience);
    _about = TextEditingController(text: m.additionalDetails);
    _bankAccount = TextEditingController(text: m.paymentBankAccount);
    _ifsc = TextEditingController(text: m.paymentIfsc);
    _branch = TextEditingController(text: m.paymentBranch);
    _holder = TextEditingController(text: m.paymentHolder);
    _upi = TextEditingController(text: m.paymentUpi);
    _gender = m.gender.isEmpty ? null : m.gender.toLowerCase();
    _qualification = _qualifications.contains(m.educationQualification)
        ? m.educationQualification
        : null;

    // Prefill any existing class selections.
    _classSel = {for (final c in widget.classes) c.id: _ClassSel()};
    for (final mc in m.classes) {
      // Remember stored per-subject prices so a re-save preserves them.
      _storedSubjectPrice[mc.id] = {for (final s in mc.subjects) s.id: s.price};
      final sel = _classSel[mc.id];
      if (sel != null) {
        sel.selected = true;
        if (mc.price > 0) sel.price.text = mc.price.toStringAsFixed(0);
        for (final s in mc.subjects) {
          sel.subjectIds.add(s.id);
        }
      } else {
        // Class no longer in the active catalog — carry it forward verbatim.
        _orphanedClasses.add({
          'class_id': mc.id,
          'price': mc.price,
          'subject': mc.subjects
              .map((s) => {'subject_id': s.id, 'subject_price': s.price})
              .toList(),
        });
      }
    }
  }

  @override
  void dispose() {
    for (final c in [
      _firstName,
      _lastName,
      _phone,
      _location,
      _experience,
      _about,
      _bankAccount,
      _ifsc,
      _branch,
      _holder,
      _upi,
    ]) {
      c.dispose();
    }
    for (final s in _classSel.values) {
      s.price.dispose();
    }
    super.dispose();
  }

  List<Map<String, dynamic>> _buildSelectedClasses() {
    final out = <Map<String, dynamic>>[];
    for (final c in widget.classes) {
      final sel = _classSel[c.id];
      if (sel == null || !sel.selected) continue;
      final stored = _storedSubjectPrice[c.id];
      final subjects = <Map<String, dynamic>>[];
      for (final s in c.subjects) {
        if (sel.subjectIds.contains(s.subjectId)) {
          subjects.add({
            'subject_id': s.subjectId,
            // Keep the mentor's previously-stored price; fall back to the
            // catalog price only for newly-added subjects.
            'subject_price': stored != null && stored.containsKey(s.subjectId)
                ? stored[s.subjectId]
                : s.price,
          });
        }
      }
      out.add({
        'class_id': c.id,
        'price': num.tryParse(sel.price.text.trim()) ?? 0,
        'subject': subjects,
      });
    }
    // Re-emit classes that aren't in the active catalog so they survive a save.
    out.addAll(_orphanedClasses);
    return out;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (_firstName.text.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter your first name.');
      return;
    }
    if (_phone.text.trim().length < 7) {
      AppSnackbar.error(context, 'Please enter a valid phone number.');
      return;
    }

    // Only include payment fields that are filled in, and omit the whole
    // payment_details object when all are blank — the backend $sets the whole
    // subdocument, so sending blanks would wipe stored bank/UPI details.
    final paymentDetails = <String, dynamic>{};
    void putPayment(String key, String value) {
      if (value.trim().isNotEmpty) paymentDetails[key] = value.trim();
    }

    putPayment('back_account', _bankAccount.text);
    putPayment('ifsc_code', _ifsc.text);
    putPayment('branch', _branch.text);
    putPayment('account_holder_name', _holder.text);
    putPayment('upi_id', _upi.text);

    final payload = <String, dynamic>{
      'firstName': _firstName.text.trim(),
      'lastName': _lastName.text.trim(),
      'phoneNumber': _phone.text.trim(),
      'gender': ?_gender,
      'location': _location.text.trim(),
      'experience': _experience.text.trim(),
      'education_qualification': ?_qualification,
      'additional_details': _about.text.trim(),
      'payment_details': ?(paymentDetails.isEmpty ? null : paymentDetails),
      'selected_class': _buildSelectedClasses(),
      'is_first_login': false,
    };

    try {
      final ok = await context.read<MentorProfileCubit>().save(payload);
      if (!mounted || !ok) return;
      await context.read<AuthCubit>().refreshUser();
      if (!mounted) return;
      Navigator.pop(context);
      AppSnackbar.success(context, 'Profile updated. Thank you!');
    } on ApiException catch (e) {
      if (mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnackbar.error(context, 'Unable to save your profile.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final saving = context.select<MentorProfileCubit, bool>(
        (c) => c.state.saving);
    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 32.h),
      children: [
        _sectionTitle('Basic details'),
        Row(
          children: [
            Expanded(
              child: AppTextField(label: 'First name', controller: _firstName),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: AppTextField(label: 'Last name', controller: _lastName),
            ),
          ],
        ),
        SizedBox(height: 16.h),
        AppTextField(
          label: 'Phone number',
          controller: _phone,
          keyboardType: TextInputType.phone,
          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]'))],
        ),
        SizedBox(height: 16.h),
        Text('Gender',
            style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13.5.sp,
                color: AppColors.textSecondary)),
        SizedBox(height: 8.h),
        Row(
          children: [
            _genderChip('male', 'Male'),
            SizedBox(width: 10.w),
            _genderChip('female', 'Female'),
          ],
        ),
        SizedBox(height: 16.h),
        AppTextField(label: 'Location', controller: _location),
        SizedBox(height: 16.h),
        _qualificationDropdown(),
        SizedBox(height: 16.h),
        AppTextField(
          label: 'Experience',
          controller: _experience,
          hint: 'e.g. 5 years teaching Physics',
        ),
        SizedBox(height: 16.h),
        AppTextField(
          label: 'About you',
          controller: _about,
          hint: 'Tell students about your background and teaching style…',
          maxLines: 4,
          textInputAction: TextInputAction.newline,
        ),
        SizedBox(height: 24.h),
        _sectionTitle('Classes you teach'),
        if (widget.classes.isEmpty)
          const Text(
            'No classes available in the catalog yet.',
            style: TextStyle(color: AppColors.textMuted),
          )
        else
          ...widget.classes.map(_classTile),
        SizedBox(height: 24.h),
        _sectionTitle('Payment details'),
        AppTextField(label: 'Bank account number', controller: _bankAccount),
        SizedBox(height: 16.h),
        AppTextField(label: 'IFSC code', controller: _ifsc),
        SizedBox(height: 16.h),
        AppTextField(label: 'Branch', controller: _branch),
        SizedBox(height: 16.h),
        AppTextField(label: 'Account holder name', controller: _holder),
        SizedBox(height: 16.h),
        AppTextField(label: 'UPI ID', controller: _upi),
        SizedBox(height: 28.h),
        PrimaryButton(
          label: 'Save profile',
          icon: LucideIcons.check,
          loading: saving,
          onPressed: saving ? null : _submit,
        ),
      ],
    );
  }

  Widget _sectionTitle(String text) => Padding(
        padding: EdgeInsets.only(bottom: 14.h),
        child: Text(
          text,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 16.sp,
            color: AppColors.textPrimary,
          ),
        ),
      );

  Widget _genderChip(String value, String label) {
    final selected = _gender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _gender = value),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 13.h),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryLight : AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(14.r),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: selected ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _qualificationDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Qualification',
            style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13.5.sp,
                color: AppColors.textSecondary)),
        SizedBox(height: 8.h),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          decoration: BoxDecoration(
            color: AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _qualification,
              isExpanded: true,
              hint: const Text('Select qualification'),
              borderRadius: BorderRadius.circular(16.r),
              items: _qualifications
                  .map((q) => DropdownMenuItem(value: q, child: Text(q)))
                  .toList(),
              onChanged: (v) => setState(() => _qualification = v),
            ),
          ),
        ),
      ],
    );
  }

  Widget _classTile(ClassItem c) {
    final sel = _classSel[c.id]!;
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(
          color: sel.selected ? AppColors.primary : AppColors.border,
        ),
      ),
      child: Column(
        children: [
          CheckboxListTile(
            value: sel.selected,
            activeColor: AppColors.primary,
            controlAffinity: ListTileControlAffinity.leading,
            title: Text(
              c.className.isEmpty ? 'Class' : c.className,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: Text(c.syllabus),
            onChanged: (v) => setState(() => sel.selected = v ?? false),
          ),
          if (sel.selected) ...[
            Padding(
              padding: EdgeInsets.fromLTRB(16.w, 0.h, 16.w, 12.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: sel.price,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                        hintText: 'Your price for this class (₹)'),
                  ),
                  if (c.subjects.isNotEmpty) ...[
                    SizedBox(height: 10.h),
                    Text('Subjects',
                        style: TextStyle(
                            fontSize: 12.5.sp,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMuted)),
                    SizedBox(height: 6.h),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: c.subjects.map((s) {
                        final on = sel.subjectIds.contains(s.subjectId);
                        return FilterChip(
                          label: Text(s.name),
                          selected: on,
                          onSelected: (v) => setState(() {
                            if (v) {
                              sel.subjectIds.add(s.subjectId);
                            } else {
                              sel.subjectIds.remove(s.subjectId);
                            }
                          }),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
