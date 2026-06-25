import 'mentor.dart';

enum BookingType { full, individual, multiple }

extension BookingTypeX on BookingType {
  String get apiValue {
    switch (this) {
      case BookingType.full:
        return 'full';
      case BookingType.individual:
        return 'individual';
      case BookingType.multiple:
        return 'multiple';
    }
  }

  String get label {
    switch (this) {
      case BookingType.full:
        return 'Full Class';
      case BookingType.individual:
        return 'Individual Subject';
      case BookingType.multiple:
        return 'Multiple Subjects';
    }
  }
}

/// Mutable wizard state collected across the booking flow before it is sent
/// to `POST /booking`.
class BookingDraft {
  final Mentor mentor;

  String? syllabus;
  MentorClass? selectedClass;
  BookingType? bookingType;
  final Set<String> selectedSubjectIds = {};

  // Student details
  String studentName = '';
  String email = '';
  String phone = '';
  String message = '';

  BookingDraft(this.mentor);

  List<MentorClass> get availableClasses =>
      syllabus == null ? const [] : mentor.classesForSyllabus(syllabus!);

  List<MentorSubject> get classSubjects => selectedClass?.subjects ?? const [];

  List<MentorSubject> get chosenSubjects =>
      classSubjects.where((s) => selectedSubjectIds.contains(s.id)).toList();

  num get totalAmount {
    final cls = selectedClass;
    if (cls == null || bookingType == null) return 0;
    switch (bookingType!) {
      case BookingType.full:
        return cls.price;
      case BookingType.individual:
      case BookingType.multiple:
        return chosenSubjects.fold<num>(0, (sum, s) => sum + s.price);
    }
  }

  bool get requiresSubjects =>
      bookingType == BookingType.individual ||
      bookingType == BookingType.multiple;

  bool get isStepOneValid {
    if (syllabus == null || selectedClass == null || bookingType == null) {
      return false;
    }
    if (requiresSubjects && selectedSubjectIds.isEmpty) return false;
    return true;
  }

  bool get isStepTwoValid =>
      studentName.trim().isNotEmpty &&
      email.trim().isNotEmpty &&
      phone.trim().isNotEmpty;

  Map<String, dynamic> toPayload({required String studentId}) {
    final cls = selectedClass!;
    final subjects = requiresSubjects ? chosenSubjects : <MentorSubject>[];
    return {
      'mentorId': mentor.id,
      'studentId': studentId,
      'studentName': studentName.trim(),
      'email': email.trim(),
      'phone': phone.trim(),
      'sessionType': 'one-time',
      'message': message.trim(),
      'agreeToTerms': true,
      'selectedSyllabus': syllabus,
      'selectedClass': {
        'class_id': {
          'class': cls.className,
          'syllabus': cls.syllabus,
        },
        'price': cls.price,
        'subject': subjects
            .map((s) => {
                  'subject_id': {'name': s.name},
                  'subject_price': s.price,
                })
            .toList(),
      },
      'bookingType': bookingType!.apiValue,
      'selectedSubjects': subjects.map((s) => s.name).toList(),
      'totalAmount': totalAmount,
      'paymentType': '',
      'paymentStatus': 'pending',
      'transactionId': '',
      'bookingDate': null,
      'orderId': DateTime.now().millisecondsSinceEpoch,
    };
  }
}
