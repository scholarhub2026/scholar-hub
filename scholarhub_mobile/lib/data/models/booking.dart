import 'booking_log.dart';

num _num(dynamic v) {
  if (v is num) return v;
  if (v is String) return num.tryParse(v) ?? 0;
  return 0;
}

DateTime? _date(dynamic v) {
  if (v is String) return DateTime.tryParse(v);
  return null;
}

String _personName(dynamic ref) {
  if (ref is Map) {
    return '${ref['firstName'] ?? ''} ${ref['lastName'] ?? ''}'.trim();
  }
  return '';
}

/// A weekly slot reserved by a booking (recurring hold or a single dated
/// session). Mirrors the backend `reservedSlots` sub-document.
class ReservedSlot {
  final int dayOfWeek; // 0=Sun … 6=Sat
  final String startTime; // "HH:mm"
  final String endTime;
  final String cadence; // recurring | single
  final DateTime? date; // set only for single sessions

  const ReservedSlot({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.cadence,
    this.date,
  });

  bool get isSingle => cadence == 'single';

  factory ReservedSlot.fromJson(Map<String, dynamic> json) {
    int day = 0;
    final d = json['dayOfWeek'];
    if (d is num) day = d.toInt();
    if (d is String) day = int.tryParse(d) ?? 0;
    return ReservedSlot(
      dayOfWeek: day,
      startTime: (json['startTime'] ?? '').toString(),
      endTime: (json['endTime'] ?? '').toString(),
      cadence: (json['cadence'] ?? 'recurring').toString(),
      date: _date(json['date']),
    );
  }

  /// e.g. "Every Mon · 18:00–19:00" or "Sat 25 Jul · 10:00–11:00".
  String get label {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    final day = (dayOfWeek >= 0 && dayOfWeek < 7) ? days[dayOfWeek] : '';
    final time = '$startTime–$endTime';
    if (isSingle && date != null) {
      final d = date!.toLocal();
      return '$day ${d.day}/${d.month} · $time';
    }
    return 'Every $day · $time';
  }
}

/// A manually collected payment recorded by the admin ("mark paid").
class PaymentRecord {
  final num amount;
  final DateTime? collectedAt;
  final String note;
  final String periodLabel; // e.g. "Aug 2026"

  const PaymentRecord({
    required this.amount,
    this.collectedAt,
    this.note = '',
    this.periodLabel = '',
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) => PaymentRecord(
        amount: _num(json['amount']),
        collectedAt: _date(json['collectedAt']),
        note: (json['note'] ?? '').toString(),
        periodLabel: (json['periodLabel'] ?? '').toString(),
      );
}

/// A booking record as returned by `/booking/:userId`. The same endpoint serves
/// students (their bookings), mentors (their confirmed sessions) and admins
/// (all bookings) — the backend filters by the caller's role.
class Booking {
  final String id;
  final String studentName;
  final String email;
  final String phone;
  final String mentorName;
  final num totalAmount;
  final String paymentStatus; // pending | completed | failed
  final String bookingStatus; // pending | confirmed | completed | cancelled
  final String bookingType;
  final String selectedSyllabus;
  final List<String> selectedSubjects;
  // subject id → display name, parsed from selectedClass.subject (billing v2).
  final Map<String, String> subjectNames;
  final String message;
  final String remarks;
  final DateTime? createdAt;
  final List<BookingLog> logs;
  final String scheduleCadence; // recurring | single | ''
  final List<ReservedSlot> reservedSlots;
  // Manual payment collection
  final String paymentFrequency; // daily | weekly | monthly | ''
  final DateTime? classStartDate;
  final DateTime? nextDueDate; // null until admin approves
  final String rejectionReason;
  final List<PaymentRecord> payments;
  final int daysOverdue; // server-computed on /payments/due (else 0)
  final String dueStatus; // overdue | today | upcoming | ''

  const Booking({
    required this.id,
    required this.studentName,
    required this.email,
    required this.phone,
    required this.mentorName,
    required this.totalAmount,
    required this.paymentStatus,
    required this.bookingStatus,
    required this.bookingType,
    required this.selectedSyllabus,
    required this.selectedSubjects,
    this.subjectNames = const {},
    required this.message,
    required this.remarks,
    required this.createdAt,
    required this.logs,
    this.scheduleCadence = '',
    this.reservedSlots = const [],
    this.paymentFrequency = '',
    this.classStartDate,
    this.nextDueDate,
    this.rejectionReason = '',
    this.payments = const [],
    this.daysOverdue = 0,
    this.dueStatus = '',
  });

  /// "day" / "week" / "month" — for "₹500/month" style labels.
  String get frequencyPerLabel {
    switch (paymentFrequency) {
      case 'daily':
        return 'day';
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      default:
        return '';
    }
  }

  /// Friendly name for a booked subject id (falls back to the id).
  String subjectLabel(String subjectId) =>
      subjectNames[subjectId] ?? subjectId;

  /// Booked subjects as {id, name} for pickers (multiple-subject bookings).
  List<({String id, String name})> get subjectOptions => selectedSubjects
      .map((id) => (id: id, name: subjectNames[id] ?? id))
      .toList();

  factory Booking.fromJson(Map<String, dynamic> json) {
    final studentNameField = (json['studentName'] ?? '').toString().trim();
    final studentName = studentNameField.isNotEmpty
        ? studentNameField
        : _personName(json['studentId']);

    final subjects = <String>[];
    final rawSubjects = json['selectedSubjects'];
    if (rawSubjects is List) {
      for (final s in rawSubjects) {
        subjects.add(s.toString());
      }
    }

    // Map subject id → name from selectedClass.subject (for billing v2 UIs).
    final subjectNames = <String, String>{};
    final selectedClass = json['selectedClass'];
    if (selectedClass is Map && selectedClass['subject'] is List) {
      for (final s in selectedClass['subject'] as List) {
        if (s is Map && s['subject_id'] is Map) {
          final ref = s['subject_id'] as Map;
          final id = (ref['_id'] ?? '').toString();
          final name = (ref['name'] ?? '').toString();
          if (id.isNotEmpty && name.isNotEmpty) subjectNames[id] = name;
        }
      }
    }

    final logs = <BookingLog>[];
    final rawLogs = json['bookingLogs'];
    if (rawLogs is List) {
      for (final l in rawLogs) {
        if (l is Map) {
          logs.add(BookingLog.fromJson(l.cast<String, dynamic>()));
        }
      }
    }

    final reserved = <ReservedSlot>[];
    final rawReserved = json['reservedSlots'];
    if (rawReserved is List) {
      for (final r in rawReserved) {
        if (r is Map) {
          reserved.add(ReservedSlot.fromJson(r.cast<String, dynamic>()));
        }
      }
    }

    final paymentList = <PaymentRecord>[];
    final rawPayments = json['payments'];
    if (rawPayments is List) {
      for (final p in rawPayments) {
        if (p is Map) {
          paymentList.add(PaymentRecord.fromJson(p.cast<String, dynamic>()));
        }
      }
    }

    return Booking(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      studentName: studentName,
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      mentorName: _personName(json['mentorId']),
      totalAmount: _num(json['totalAmount']),
      paymentStatus: (json['paymentStatus'] ?? 'pending').toString(),
      bookingStatus: (json['bookingStatus'] ?? 'pending').toString(),
      bookingType: (json['bookingType'] ?? '').toString(),
      selectedSyllabus: (json['selectedSyllabus'] ?? '').toString(),
      selectedSubjects: subjects,
      subjectNames: subjectNames,
      message: (json['message'] ?? '').toString(),
      remarks: (json['remarks'] ?? '').toString(),
      createdAt: _date(json['createdAt']),
      logs: logs,
      scheduleCadence: (json['scheduleCadence'] ?? '').toString(),
      reservedSlots: reserved,
      paymentFrequency: (json['paymentFrequency'] ?? '').toString(),
      classStartDate: _date(json['classStartDate']),
      nextDueDate: _date(json['nextDueDate']),
      rejectionReason: (json['rejectionReason'] ?? '').toString(),
      payments: paymentList,
      daysOverdue: json['daysOverdue'] is num
          ? (json['daysOverdue'] as num).toInt()
          : 0,
      dueStatus: (json['dueStatus'] ?? '').toString(),
    );
  }
}

class PaginatedBookings {
  final List<Booking> bookings;
  final int totalPages;
  final int currentPage;
  final int total;

  const PaginatedBookings({
    required this.bookings,
    required this.totalPages,
    required this.currentPage,
    required this.total,
  });
}
