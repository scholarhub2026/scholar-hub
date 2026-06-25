/// A session log attached to a booking (`booking.bookingLogs[]` /
/// `/bookingLog/:bookingId`).
class BookingLog {
  final String id;
  final DateTime? date;
  final String startTime;
  final String endTime;
  final String notes;

  const BookingLog({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.notes,
  });

  factory BookingLog.fromJson(Map<String, dynamic> json) {
    return BookingLog(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      date: json['date'] is String ? DateTime.tryParse(json['date']) : null,
      startTime: (json['startTime'] ?? '').toString(),
      endTime: (json['endTime'] ?? '').toString(),
      notes: (json['notes'] ?? '').toString(),
    );
  }
}
