import 'package:flutter/material.dart';

import '../../data/models/mentor.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/booking/booking_screen.dart';
import '../../features/forms/become_mentor_sheet.dart';
import '../../features/forms/enquiry_sheet.dart';
import '../../core/utils/subject_visuals.dart';
import '../../features/info/info_screen.dart';
import '../../features/mentors/mentor_detail_screen.dart';
import '../../features/mentors/mentors_screen.dart';
import '../../features/subjects/subjects_screen.dart';

/// Centralised navigation helpers so screens don't import each other directly.
class AppNavigator {
  AppNavigator._();

  static Future<T?> _push<T>(BuildContext context, Widget page) {
    return Navigator.of(context).push<T>(
      MaterialPageRoute(builder: (_) => page),
    );
  }

  static Future<void> toMentorDetail(BuildContext context, String mentorId) =>
      _push(context, MentorDetailScreen(mentorId: mentorId));

  static Future<bool?> toBooking(BuildContext context, Mentor mentor) =>
      _push<bool>(context, BookingScreen(mentor: mentor));

  static Future<void> toLogin(BuildContext context) =>
      _push(context, const LoginScreen());

  static Future<void> toSignup(BuildContext context) =>
      _push(context, const SignupScreen());

  static Future<void> toInfo(BuildContext context, InfoPage page) =>
      _push(context, InfoScreen(page: page));

  static Future<void> toSubjects(BuildContext context) =>
      _push(context, const SubjectsScreen());

  /// Mentors that teach a given subject (drill-down from the subjects list).
  static Future<void> toSubjectMentors(BuildContext context, String subject) =>
      _push(
        context,
        MentorsScreen(
          initialQuery: subject,
          filterNonce: 1,
          showBack: true,
          lockedTitle: '${subjectTitle(subject)} mentors',
        ),
      );

  static void openEnquiry(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const EnquirySheet(),
    );
  }

  static void openBecomeMentor(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const BecomeMentorSheet(),
    );
  }
}
