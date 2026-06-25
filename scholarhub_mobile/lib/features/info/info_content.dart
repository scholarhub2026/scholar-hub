import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

enum InfoPage { about, contact, terms, privacy, cookies, refund, shipping }

class InfoPageData {
  final String title;
  final IconData icon;
  final List<InfoBlock> blocks;

  const InfoPageData({
    required this.title,
    required this.icon,
    required this.blocks,
  });
}

/// A block of content: an optional heading followed by paragraphs or bullets.
class InfoBlock {
  final String? heading;
  final List<String> paragraphs;
  final List<String> bullets;

  const InfoBlock({this.heading, this.paragraphs = const [], this.bullets = const []});
}

const Map<InfoPage, InfoPageData> kInfoPages = {
  InfoPage.about: InfoPageData(
    title: 'About Scholar Hub',
    icon: LucideIcons.info,
    blocks: [
      InfoBlock(paragraphs: [
        'Empowering Young Minds, One Lesson at a Time — since 2025.',
        'Scholar Hub is a personalized home-tutoring service based in '
            'Kazhakuttom, dedicated to helping students learn better through '
            'one-on-one guidance. We connect students with qualified, caring '
            'tutors who teach right at their doorstep — making quality '
            'education accessible, comfortable, and effective.',
      ]),
      InfoBlock(heading: 'What We Offer', bullets: [
        'One-on-One Home Tutoring: Focused, distraction-free learning at home.',
        'Qualified Tutors: Experienced, background-verified educators.',
        'Monthly Plans: Affordable, flexible subscriptions for every family.',
        'Student Progress Monitoring: Regular updates on your child’s growth.',
      ]),
      InfoBlock(heading: 'Our Vision', paragraphs: [
        'To become Kerala’s most trusted home-tutoring community, nurturing '
            'confident, curious and capable learners.',
      ]),
      InfoBlock(heading: 'Our Mission', bullets: [
        'Deliver personalized learning that fits each student.',
        'Build trust between families and educators.',
        'Make quality tutoring affordable and accessible.',
      ]),
    ],
  ),
  InfoPage.contact: InfoPageData(
    title: 'Contact Us',
    icon: LucideIcons.phone,
    blocks: [
      InfoBlock(paragraphs: [
        'We’re here to help! Reach out to us through any of the methods below '
            'and our team will get back to you as soon as possible.',
      ]),
    ],
  ),
  InfoPage.terms: InfoPageData(
    title: 'Terms of Service',
    icon: LucideIcons.fileText,
    blocks: [
      InfoBlock(heading: 'Acceptance of Terms', paragraphs: [
        'By accessing or using Scholar Hub, you agree to be bound by these '
            'Terms of Service and our Privacy Policy.',
      ]),
      InfoBlock(heading: 'Use of Service', paragraphs: [
        'Scholar Hub connects students with verified mentors for tutoring '
            'sessions. You agree to provide accurate information and to use the '
            'platform lawfully and respectfully.',
      ]),
      InfoBlock(heading: 'Bookings & Payments', paragraphs: [
        'Session prices are shown before you confirm a booking. Payments are '
            'processed securely through our payment partner. Completing a '
            'booking constitutes acceptance of the listed price.',
      ]),
    ],
  ),
  InfoPage.privacy: InfoPageData(
    title: 'Privacy Policy',
    icon: LucideIcons.shieldCheck,
    blocks: [
      InfoBlock(heading: 'Information We Collect', paragraphs: [
        'We collect the details you provide — such as your name, email, phone '
            'number and booking preferences — to deliver and improve our '
            'services.',
      ]),
      InfoBlock(heading: 'How We Use It', paragraphs: [
        'Your information is used to process bookings, communicate with you, '
            'and personalize your experience. We never sell your data.',
      ]),
      InfoBlock(heading: 'Data Security', paragraphs: [
        'We use industry-standard safeguards to protect your information. '
            'Payments are handled by our secure payment partner.',
      ]),
    ],
  ),
  InfoPage.cookies: InfoPageData(
    title: 'Cookie Policy',
    icon: LucideIcons.fileText,
    blocks: [
      InfoBlock(paragraphs: [
        'Scholar Hub uses cookies and similar technologies to keep you signed '
            'in, remember your preferences, and understand how the app is '
            'used so we can keep improving it.',
      ]),
    ],
  ),
  InfoPage.refund: InfoPageData(
    title: 'Cancellations & Refunds',
    icon: LucideIcons.wallet,
    blocks: [
      InfoBlock(heading: 'Cancellations', paragraphs: [
        'You may request to cancel a booked session by contacting our support '
            'team. Cancellation timelines and eligibility may vary by mentor.',
      ]),
      InfoBlock(heading: 'Refunds', paragraphs: [
        'Eligible refunds are processed to your original payment method. '
            'Please allow a few business days for the amount to reflect.',
      ]),
    ],
  ),
  InfoPage.shipping: InfoPageData(
    title: 'Service Delivery',
    icon: LucideIcons.send,
    blocks: [
      InfoBlock(paragraphs: [
        'Scholar Hub provides tutoring services (online and at-home), not '
            'physical goods. Once a booking is confirmed, our team coordinates '
            'with you and your mentor to schedule the session.',
      ]),
    ],
  ),
};
