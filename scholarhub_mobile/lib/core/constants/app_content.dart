import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';

/// Static marketing copy + contact details lifted verbatim from the web app so
/// the mobile experience stays on-brand.
class AppContent {
  AppContent._();

  static const String appName = 'Scholar Hub';
  static const String tagline = 'Empowering Young Minds, One Lesson at a Time';

  // Contact (from web `data/index.ts`)
  static const String email = 'scholahub25@gmail.com';
  static const String phone1 = '7558965182';
  static const String phone2 = '9447326335';
  static const String website = 'www.scholarhub.live';
  static const String websiteUrl = 'https://www.scholarhub.live';

  // Hero
  static const String heroBadge = 'New: Group Sessions Available!';
  static const String heroTitle = 'Expert Mentorship for Academic Excellence';
  static const String heroSubtitle =
      'Connect with verified mentors who are experts in their fields. From '
      'math and science to languages and test prep, find the perfect mentor '
      'for your academic journey.';
  static const String heroPriceNote = 'Starting at just ₹150/hour';

  static const List<FeatureItem> features = [
    FeatureItem(
      icon: LucideIcons.bell,
      title: 'Personalized Learning',
      description:
          'Our mentors create custom learning plans tailored to your specific '
          'learning style and goals.',
    ),
    FeatureItem(
      icon: LucideIcons.shieldCheck,
      title: 'Verified Experts',
      description:
          'All our mentors undergo a rigorous verification process to ensure '
          'they are qualified and experienced.',
    ),
    FeatureItem(
      icon: LucideIcons.calendarDays,
      title: 'Flexible Scheduling',
      description:
          'Book sessions when it works for you with our easy-to-use calendar '
          'and scheduling system.',
    ),
    FeatureItem(
      icon: LucideIcons.messageSquare,
      title: 'Real-Time Feedback',
      description:
          'Get instant feedback during sessions and detailed follow-ups to '
          'track your progress.',
    ),
    FeatureItem(
      icon: LucideIcons.users,
      title: 'Group Sessions',
      description:
          'Learn collaboratively with others in small-group sessions that '
          'foster peer learning at a reduced cost.',
    ),
    FeatureItem(
      icon: LucideIcons.send,
      title: 'Goal Tracking',
      description:
          'Set academic goals and track your progress with our intuitive '
          'dashboard and reporting tools.',
    ),
  ];

  static const List<StepItem> howItWorks = [
    StepItem(
      number: '01',
      title: 'Find Your Ideal Mentor',
      description:
          'Browse our extensive network of verified mentors, filter by '
          'subject, expertise, and availability to find your perfect match.',
    ),
    StepItem(
      number: '02',
      title: 'Schedule a Session',
      description:
          'Book a one-on-one or group session with your chosen mentor at a '
          'time that works for you using our calendar system.',
    ),
    StepItem(
      number: '03',
      title: 'Connect and Learn',
      description:
          'Meet with your mentor via our platform for personalized guidance, '
          'homework help, or exam preparation.',
    ),
    StepItem(
      number: '04',
      title: 'Track Your Progress',
      description:
          'Review session notes, complete assignments, and monitor your '
          'improvement through our dashboard.',
    ),
  ];

  static const List<SubjectItem> subjects = [
    SubjectItem('Mathematics', LucideIcons.calculator, 0),
    SubjectItem('Science', LucideIcons.flaskConical, 1),
    SubjectItem('Language Arts', LucideIcons.bookOpen, 2),
    SubjectItem('Social Studies', LucideIcons.globe, 3),
    SubjectItem('Foreign Languages', LucideIcons.languages, 4),
    SubjectItem('Test Preparation', LucideIcons.clipboardCheck, 5),
    SubjectItem('Music', LucideIcons.music, 6),
    SubjectItem('Computer Science', LucideIcons.code, 7),
  ];

  static const List<TestimonialItem> testimonials = [
    TestimonialItem(
      content:
          "My daughter's math skills improved dramatically after just a few "
          "sessions. Her mentor not only helped with homework but also built "
          "her confidence.",
      author: 'Sarah Johnson',
      role: 'Parent of 8th Grader',
      image: 'https://i.pravatar.cc/150?img=32',
    ),
    TestimonialItem(
      content:
          "Scholar Hub helped me prepare for my SATs and I scored 200 points "
          "higher than on my practice tests. My mentor knew exactly what to "
          "focus on.",
      author: 'James Lee',
      role: 'High School Senior',
      image: 'https://i.pravatar.cc/150?img=59',
    ),
    TestimonialItem(
      content:
          "As a college student struggling with advanced physics, my mentor's "
          "guidance was invaluable. He explained complex concepts in ways that "
          "finally made sense to me.",
      author: 'Emily Rodriguez',
      role: 'College Sophomore',
      image: 'https://i.pravatar.cc/150?img=47',
    ),
    TestimonialItem(
      content:
          "Being a mentor on Scholar Hub has been incredibly rewarding. The "
          "platform makes it easy to connect with students and the scheduling "
          "system is seamless.",
      author: 'Dr. Michael Chen',
      role: 'Math Mentor, 4 years',
      image: 'https://i.pravatar.cc/150?img=51',
    ),
  ];

  static const List<String> syllabusOptions = ['CBSE', 'ICSE', 'SCERT'];

  // About page
  static const String aboutIntro =
      'Scholar Hub is a personalized home-tutoring service based in '
      'Kazhakuttom, dedicated to helping students learn better through '
      'one-on-one guidance. We connect students with qualified, caring tutors '
      'who teach right at their doorstep — making quality education accessible, '
      'comfortable, and effective.';

  static const List<String> aboutOffers = [
    '📚 One-on-One Home Tutoring: Focused, distraction-free learning at home.',
    '🎓 Qualified Tutors: Experienced, background-verified educators.',
    '💡 Monthly Plans: Affordable, flexible subscriptions for every family.',
    '📈 Student Progress Monitoring: Regular updates on your child’s growth.',
  ];

  static const String aboutVision =
      'To become Kerala’s most trusted home-tutoring community, nurturing '
      'confident, curious and capable learners.';

  static const List<String> aboutMission = [
    'Deliver personalized learning that fits each student.',
    'Build trust between families and educators.',
    'Make quality tutoring affordable and accessible.',
  ];
}

class FeatureItem {
  final IconData icon;
  final String title;
  final String description;
  const FeatureItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}

class StepItem {
  final String number;
  final String title;
  final String description;
  const StepItem({
    required this.number,
    required this.title,
    required this.description,
  });
}

class SubjectItem {
  final String name;
  final IconData icon;
  final int swatch;
  const SubjectItem(this.name, this.icon, this.swatch);

  List<Color> get colors => AppColors.subjectSwatches[swatch];
}

class TestimonialItem {
  final String content;
  final String author;
  final String role;
  final String image;
  const TestimonialItem({
    required this.content,
    required this.author,
    required this.role,
    required this.image,
  });
}
