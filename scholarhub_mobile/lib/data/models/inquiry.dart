DateTime? _date(dynamic v) => v is String ? DateTime.tryParse(v) : null;

/// An enquiry-form submission as returned by `/inquery-form`.
class Inquiry {
  final String id;
  final String name;
  final String email;
  final String phoneNumber;
  final String place;
  final String subject;
  final String message;
  final String status; // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  final DateTime? createdAt;

  const Inquiry({
    required this.id,
    required this.name,
    required this.email,
    required this.phoneNumber,
    required this.place,
    required this.subject,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  bool get isPending => status.toUpperCase() == 'PENDING';

  factory Inquiry.fromJson(Map<String, dynamic> json) {
    return Inquiry(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phoneNumber: (json['phoneNumber'] ?? '').toString(),
      place: (json['place'] ?? '').toString(),
      subject: (json['subject'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      createdAt: _date(json['createdAt']),
    );
  }
}

/// Inquiry statuses the admin can set (backend enum values).
const kInquiryStatuses = <String>[
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

class PaginatedInquiries {
  final List<Inquiry> items;
  final int totalPages;
  final int currentPage;
  final int total;

  const PaginatedInquiries({
    required this.items,
    required this.totalPages,
    required this.currentPage,
    required this.total,
  });
}
