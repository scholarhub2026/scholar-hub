import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../data/services/mentor_service.dart';
import 'lead_form_sheet.dart';

class BecomeMentorSheet extends StatelessWidget {
  const BecomeMentorSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final service = MentorService();
    return LeadFormSheet(
      title: 'Become a Mentor',
      subtitle: 'Share your details and start teaching.',
      icon: LucideIcons.graduationCap,
      messageHint: 'Tell us about yourself & your expertise',
      onSubmit: (data) => service.submitMentorApplication(
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        place: data.place.trim(),
        message: data.message.trim(),
      ),
    );
  }
}
