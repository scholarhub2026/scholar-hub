import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../data/services/inquiry_service.dart';
import 'lead_form_sheet.dart';

class EnquirySheet extends StatelessWidget {
  const EnquirySheet({super.key});

  @override
  Widget build(BuildContext context) {
    final service = InquiryService();
    return LeadFormSheet(
      title: 'Enquiry Now',
      subtitle: 'Tell us what you need — we’ll reach out.',
      icon: LucideIcons.send,
      showSubject: true,
      messageHint: 'What are you looking for help with?',
      onSubmit: (data) => service.submitInquiry(
        name: data.name.trim(),
        email: data.email.trim(),
        phoneNumber: data.phone.trim(),
        place: data.place.trim(),
        subject: data.subject.trim(),
        message: data.message.trim(),
      ),
    );
  }
}
