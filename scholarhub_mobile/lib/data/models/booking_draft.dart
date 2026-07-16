import 'mentor.dart';

enum BookingType { full, individual, multiple }

enum SessionMode { online, offline }

/// How a student books a slot: a recurring weekly hold or a one-off session.
enum ScheduleCadence { recurring, single }

/// How often the class fee is collected (manually, after classes). The
/// booking's total amount is the fee PER period.
enum PaymentFrequency { daily, weekly, monthly }

extension PaymentFrequencyX on PaymentFrequency {
  String get apiValue {
    switch (this) {
      case PaymentFrequency.daily:
        return 'daily';
      case PaymentFrequency.weekly:
        return 'weekly';
      case PaymentFrequency.monthly:
        return 'monthly';
    }
  }

  String get label {
    switch (this) {
      case PaymentFrequency.daily:
        return 'Daily';
      case PaymentFrequency.weekly:
        return 'Weekly';
      case PaymentFrequency.monthly:
        return 'Monthly';
    }
  }

  String get perLabel {
    switch (this) {
      case PaymentFrequency.daily:
        return 'day';
      case PaymentFrequency.weekly:
        return 'week';
      case PaymentFrequency.monthly:
        return 'month';
    }
  }
}

extension ScheduleCadenceX on ScheduleCadence {
  String get apiValue =>
      this == ScheduleCadence.recurring ? 'recurring' : 'single';

  String get label =>
      this == ScheduleCadence.recurring ? 'Weekly' : 'Single session';
}

/// "YYYY-MM-DD" from a picked calendar day. Uses the local date components so
/// the day the student sees is exactly what the backend records (no TZ shift).
String slotDateKey(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}';
}

/// A slot the student selected during the schedule step.
class SelectedSlot {
  final String slotId;
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final ScheduleCadence cadence;
  final DateTime? date; // required for single sessions

  const SelectedSlot({
    required this.slotId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.cadence,
    this.date,
  });

  Map<String, dynamic> toPayload() => {
        'slotId': slotId,
        'dayOfWeek': dayOfWeek,
        'startTime': startTime,
        'endTime': endTime,
        'cadence': cadence.apiValue,
        if (date != null) 'date': slotDateKey(date!),
      };
}

extension SessionModeX on SessionMode {
  String get apiValue => this == SessionMode.online ? 'online' : 'offline';

  String get label => this == SessionMode.online ? 'Online' : 'Offline';
}

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
  SessionMode sessionMode = SessionMode.online;
  final Set<String> selectedSubjectIds = {};

  // Scheduling
  ScheduleCadence scheduleCadence = ScheduleCadence.recurring;
  final List<SelectedSlot> selectedSlots = [];

  // Manual payment collection — fees are collected AFTER classes.
  PaymentFrequency paymentFrequency = PaymentFrequency.monthly;
  DateTime? classStartDate; // recurring only; single derives it

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

  /// Schedule step: at least one slot, every single-session slot has a date,
  /// and recurring bookings picked a class start date.
  bool get isScheduleValid {
    if (selectedSlots.isEmpty) return false;
    for (final s in selectedSlots) {
      if (s.cadence == ScheduleCadence.single && s.date == null) return false;
    }
    if (scheduleCadence == ScheduleCadence.recurring && classStartDate == null) {
      return false;
    }
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
      'sessionMode': sessionMode.apiValue,
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
      'scheduleCadence': scheduleCadence.apiValue,
      'reservedSlots': selectedSlots.map((s) => s.toPayload()).toList(),
      'bookingDate': _earliestSingleDateKey(),
      // Manual collection: fee per period + when classes begin. Single-session
      // bookings derive the start from their earliest session date server-side.
      'paymentFrequency': paymentFrequency.apiValue,
      'classStartDate': scheduleCadence == ScheduleCadence.recurring
          ? (classStartDate != null ? slotDateKey(classStartDate!) : null)
          : _earliestSingleDateKey(),
    };
  }

  /// Earliest single-session date (as "YYYY-MM-DD") for `bookingDate`, or null
  /// for recurring-only bookings.
  String? _earliestSingleDateKey() {
    final dates = selectedSlots
        .where((s) => s.cadence == ScheduleCadence.single && s.date != null)
        .map((s) => s.date!)
        .toList()
      ..sort();
    return dates.isEmpty ? null : slotDateKey(dates.first);
  }
}
