import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:scholarhub/core/theme/app_theme.dart';
import 'package:scholarhub/data/models/booking_draft.dart';
import 'package:scholarhub/data/models/mentor.dart';
import 'package:scholarhub/features/auth/login_screen.dart';
import 'package:scholarhub/features/auth/otp_screen.dart';
import 'package:scholarhub/features/auth/signup_screen.dart';
import 'package:scholarhub/features/booking/widgets/booking_confirmation.dart';
import 'package:scholarhub/features/booking/widgets/booking_plan_step.dart';
import 'package:scholarhub/features/booking/widgets/booking_progress.dart';
import 'package:scholarhub/features/booking/widgets/booking_review_step.dart';
import 'package:scholarhub/features/bookings/bookings_screen.dart';
import 'package:scholarhub/features/forms/become_mentor_sheet.dart';
import 'package:scholarhub/features/forms/enquiry_sheet.dart';
import 'package:scholarhub/features/home/home_screen.dart';
import 'package:scholarhub/features/info/info_screen.dart';
import 'package:scholarhub/features/mentors/mentors_screen.dart';
import 'package:scholarhub/features/mentors/widgets/mentor_card.dart';
import 'package:scholarhub/features/subjects/subjects_screen.dart';
import 'package:scholarhub/features/profile/profile_screen.dart';
import 'package:scholarhub/features/profile/update_password_screen.dart';
import 'package:scholarhub/features/shell/splash_screen.dart';
import 'package:scholarhub/state/auth/auth_cubit.dart';

Mentor _fakeMentor() => Mentor.fromJson({
      '_id': 'm1',
      'firstName': 'Asha',
      'lastName': 'Menon',
      'email': 'asha@example.com',
      'phoneNumber': '9999999999',
      'experience': '8 years teaching',
      'education_qualification': 'M.Sc Mathematics',
      'additional_details': '<p>Passionate mathematics mentor.</p>',
      'rating': '4.9',
      'location': 'Kazhakuttom',
      'gender': 'female',
      'is_available': true,
      'available_slot': [
        {'time': '2024-01-01T09:30:00.000Z'},
        {'time': '4:00 PM'},
      ],
      'selected_class': [
        {
          'class_id': {'_id': 'c1', 'class': 'Class 10', 'syllabus': 'CBSE'},
          'price': 1500,
          'subject': [
            {
              'subject_id': {'_id': 's1', 'name': 'Mathematics'},
              'subject_price': 600
            },
            {
              'subject_id': {'_id': 's2', 'name': 'Science'},
              'subject_price': 500
            },
          ],
        },
        {
          'class_id': {'_id': 'c2', 'class': 'Class 12', 'syllabus': 'ICSE'},
          'price': 2000,
          'subject': [
            {
              'subject_id': {'_id': 's3', 'name': 'Physics'},
              'subject_price': 800
            },
          ],
        },
      ],
    });

Future<void> _pump(WidgetTester tester, Widget child, {bool withAuth = false}) async {
  // Phone-sized surface.
  tester.view.physicalSize = const Size(390 * 3, 844 * 3);
  tester.view.devicePixelRatio = 3.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  Widget app = ScreenUtilInit(
    designSize: const Size(390, 844),
    builder: (_, _) => MaterialApp(theme: AppTheme.light(), home: child),
  );
  if (withAuth) {
    app = BlocProvider<AuthCubit>(
      create: (_) => AuthCubit(),
      child: app,
    );
  }
  await tester.pumpWidget(app);
  // A couple of frames for animations to settle (avoid network-driven settle).
  await tester.pump(const Duration(milliseconds: 600));
}

void _expectNoLayoutError(WidgetTester tester) {
  final ex = tester.takeException();
  expect(ex, isNull, reason: 'Unexpected rendering exception: $ex');
}

void main() {
  setUpAll(() {
    // Don't hit the network for fonts in tests; use bundled fallbacks.
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  testWidgets('SplashScreen renders without layout errors', (tester) async {
    await _pump(tester, const SplashScreen());
    _expectNoLayoutError(tester);
  });

  testWidgets('HomeScreen renders without layout errors', (tester) async {
    await _pump(tester, HomeScreen(onBrowseMentors: () {}, onSubjectTap: (_) {}),
        withAuth: true);
    _expectNoLayoutError(tester);
  });

  testWidgets('All InfoScreen pages render without layout errors',
      (tester) async {
    for (final page in InfoPage.values) {
      await _pump(tester, InfoScreen(page: page));
      _expectNoLayoutError(tester);
    }
  });

  testWidgets('Auth screens render without layout errors', (tester) async {
    await _pump(tester, const LoginScreen(), withAuth: true);
    _expectNoLayoutError(tester);
    await _pump(tester, const SignupScreen(), withAuth: true);
    _expectNoLayoutError(tester);
    await _pump(tester,
        const OtpScreen(userId: 'u1', email: 'a@b.com'), withAuth: true);
    _expectNoLayoutError(tester);
    await _pump(tester, const UpdatePasswordScreen(), withAuth: true);
    _expectNoLayoutError(tester);
  });

  testWidgets('Lead form sheets render without layout errors', (tester) async {
    await _pump(tester, const Scaffold(body: EnquirySheet()));
    _expectNoLayoutError(tester);
    await _pump(tester, const Scaffold(body: BecomeMentorSheet()));
    _expectNoLayoutError(tester);
  });

  testWidgets('MentorCard renders without layout errors', (tester) async {
    await _pump(
      tester,
      Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(20),
          child: MentorCard(mentor: _fakeMentor(), onTap: () {}),
        ),
      ),
    );
    _expectNoLayoutError(tester);
  });

  testWidgets('Booking steps render without layout errors', (tester) async {
    final draft = BookingDraft(_fakeMentor())
      ..syllabus = 'CBSE'
      ..studentName = 'Test Student'
      ..email = 'test@example.com'
      ..phone = '9999999999';
    draft.selectedClass = draft.availableClasses.first;
    draft.bookingType = BookingType.multiple;
    draft.selectedSubjectIds.addAll(draft.classSubjects.map((s) => s.id));

    await _pump(tester, const Scaffold(body: BookingProgress(currentStep: 1)));
    _expectNoLayoutError(tester);

    await _pump(
        tester, Scaffold(body: BookingPlanStep(draft: draft, onChanged: () {})));
    _expectNoLayoutError(tester);

    await _pump(tester, Scaffold(body: BookingReviewStep(draft: draft)));
    _expectNoLayoutError(tester);

    await _pump(
        tester, Scaffold(body: BookingConfirmation(draft: draft, onDone: () {})));
    _expectNoLayoutError(tester);
  });

  testWidgets('Profile (guest) renders without layout errors', (tester) async {
    await _pump(tester, ProfileScreen(onBrowseMentors: () {}), withAuth: true);
    _expectNoLayoutError(tester);
  });

  testWidgets('Bookings (signed-out) renders without layout errors',
      (tester) async {
    await _pump(tester, BookingsScreen(onBrowseMentors: () {}), withAuth: true);
    _expectNoLayoutError(tester);
  });

  testWidgets('SubjectsScreen renders without layout errors', (tester) async {
    await _pump(tester, const SubjectsScreen());
    _expectNoLayoutError(tester);
  });

  testWidgets('Mentors (pushed, subject-filtered) renders without errors',
      (tester) async {
    await _pump(
      tester,
      const MentorsScreen(
        initialQuery: 'Mathematics',
        filterNonce: 1,
        showBack: true,
        lockedTitle: 'Mathematics mentors',
      ),
    );
    _expectNoLayoutError(tester);
  });
}
