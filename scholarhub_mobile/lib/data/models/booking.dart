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
  final String message;
  final String remarks;
  final DateTime? createdAt;
  final List<BookingLog> logs;

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
    required this.message,
    required this.remarks,
    required this.createdAt,
    required this.logs,
  });

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

    final logs = <BookingLog>[];
    final rawLogs = json['bookingLogs'];
    if (rawLogs is List) {
      for (final l in rawLogs) {
        if (l is Map) {
          logs.add(BookingLog.fromJson(l.cast<String, dynamic>()));
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
      message: (json['message'] ?? '').toString(),
      remarks: (json['remarks'] ?? '').toString(),
      createdAt: _date(json['createdAt']),
      logs: logs,
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
