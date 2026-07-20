// Billing v2 (SRD) client models: sessions, invoices and settlements.
// Small, defensive parsers matching the backend JSON shapes.

num _num(dynamic v) {
  if (v is num) return v;
  if (v is String) return num.tryParse(v) ?? 0;
  return 0;
}

int _int(dynamic v) => _num(v).toInt();

DateTime? _date(dynamic v) => v is String ? DateTime.tryParse(v) : null;

String _str(dynamic v) => (v ?? '').toString();

String _personName(dynamic ref) {
  if (ref is Map) {
    final n = '${ref['firstName'] ?? ''} ${ref['lastName'] ?? ''}'.trim();
    return n;
  }
  return '';
}

/// A completed class session logged by a mentor (SRD Sessions & Attendance).
class SessionRecord {
  final String id;
  final String bookingId;
  final String studentName;
  final String mentorName;
  final String bookingType;
  final String className;
  final DateTime? date;
  final String startTime;
  final String endTime;
  final int durationMinutes;
  final String? subjectId;
  final String subjectName;
  final String notes;
  final String status; // logged | verified | rejected
  final String rejectReason;
  final String? invoiceId;

  const SessionRecord({
    required this.id,
    required this.bookingId,
    required this.studentName,
    required this.mentorName,
    required this.bookingType,
    required this.className,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    required this.subjectId,
    required this.subjectName,
    required this.notes,
    required this.status,
    required this.rejectReason,
    required this.invoiceId,
  });

  bool get isLogged => status == 'logged';
  bool get isVerified => status == 'verified';
  bool get isRejected => status == 'rejected';
  bool get isBilled => invoiceId != null && invoiceId!.isNotEmpty;

  String get durationLabel {
    final h = durationMinutes ~/ 60;
    final m = durationMinutes % 60;
    final parts = <String>[];
    if (h > 0) parts.add('${h}h');
    if (m > 0) parts.add('${m}m');
    return parts.isEmpty ? '0m' : parts.join(' ');
  }

  factory SessionRecord.fromJson(Map<String, dynamic> json) {
    final booking = json['bookingId'];
    final bookingMap = booking is Map ? booking : const {};
    final selectedClass = bookingMap['selectedClass'];
    String className = '';
    if (selectedClass is Map && selectedClass['class_id'] is Map) {
      className = _str(selectedClass['class_id']['class']);
    }
    return SessionRecord(
      id: _str(json['_id']),
      bookingId: booking is Map ? _str(bookingMap['_id']) : _str(booking),
      studentName: _str(bookingMap['studentName']),
      mentorName: _personName(json['mentorId']),
      bookingType: _str(bookingMap['bookingType']),
      className: className,
      date: _date(json['date']),
      startTime: _str(json['startTime']),
      endTime: _str(json['endTime']),
      durationMinutes: _int(json['durationMinutes']),
      subjectId: json['subjectId'] == null ? null : _str(json['subjectId']),
      subjectName: _str(json['subjectName']),
      notes: _str(json['notes']),
      status: _str(json['status']).isEmpty ? 'logged' : _str(json['status']),
      rejectReason: _str(json['rejectReason']),
      invoiceId: json['invoiceId'] == null ? null : _str(json['invoiceId']),
    );
  }
}

class InvoiceLineItem {
  final String description;
  final num quantity;
  final String unit; // session | hour
  final num rate;
  final num amount;

  const InvoiceLineItem({
    required this.description,
    required this.quantity,
    required this.unit,
    required this.rate,
    required this.amount,
  });

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) => InvoiceLineItem(
        description: _str(json['description']),
        quantity: _num(json['quantity']),
        unit: _str(json['unit']),
        rate: _num(json['rate']),
        amount: _num(json['amount']),
      );
}

/// One billing cycle of a metered booking (SRD Invoices).
class InvoiceRecord {
  final String id;
  final String invoiceNumber;
  final String bookingId;
  final String studentName;
  final String email;
  final String mentorName;
  final String periodLabel;
  final List<InvoiceLineItem> lineItems;
  final num amount;
  final String status; // payment_due | paid | settled | void
  final int daysOverdue;
  final DateTime? paidAt;

  const InvoiceRecord({
    required this.id,
    required this.invoiceNumber,
    required this.bookingId,
    required this.studentName,
    required this.email,
    required this.mentorName,
    required this.periodLabel,
    required this.lineItems,
    required this.amount,
    required this.status,
    required this.daysOverdue,
    required this.paidAt,
  });

  bool get isDue => status == 'payment_due';
  bool get isPaid => status == 'paid';
  bool get isSettled => status == 'settled';
  bool get isOverdue => isDue && daysOverdue > 0;

  factory InvoiceRecord.fromJson(Map<String, dynamic> json) {
    final rawItems = json['lineItems'];
    final items = <InvoiceLineItem>[];
    if (rawItems is List) {
      for (final li in rawItems) {
        if (li is Map) {
          items.add(InvoiceLineItem.fromJson(li.cast<String, dynamic>()));
        }
      }
    }
    return InvoiceRecord(
      id: _str(json['_id']),
      invoiceNumber: _str(json['invoiceNumber']),
      bookingId: _str(json['bookingId']),
      studentName: _str(json['studentName']),
      email: _str(json['email']),
      mentorName: _str(json['mentorName']),
      periodLabel: _str(json['periodLabel']),
      lineItems: items,
      amount: _num(json['amount']),
      status: _str(json['status']).isEmpty
          ? 'payment_due'
          : _str(json['status']),
      daysOverdue: _int(json['daysOverdue']),
      paidAt: _date(json['paidAt']),
    );
  }
}

class SettlementRecord {
  final String id;
  final String settlementNumber;
  final String mentorId;
  final String mentorName;
  final num amount;
  final String method;
  final String reference;
  final DateTime? paidAt;
  final String status; // recorded | void

  const SettlementRecord({
    required this.id,
    required this.settlementNumber,
    required this.mentorId,
    required this.mentorName,
    required this.amount,
    required this.method,
    required this.reference,
    required this.paidAt,
    required this.status,
  });

  bool get isRecorded => status == 'recorded';

  factory SettlementRecord.fromJson(Map<String, dynamic> json) =>
      SettlementRecord(
        id: _str(json['_id']),
        settlementNumber: _str(json['settlementNumber']),
        mentorId: _str(json['mentorId']),
        mentorName: _str(json['mentorName']),
        amount: _num(json['amount']),
        method: _str(json['method']),
        reference: _str(json['reference']),
        paidAt: _date(json['paidAt']),
        status: _str(json['status']).isEmpty ? 'recorded' : _str(json['status']),
      );
}

/// Paid-but-unsettled invoices grouped by mentor (admin settle screen).
class MentorPending {
  final String mentorId;
  final String mentorName;
  final num total;
  final List<PendingInvoiceRef> invoices;

  const MentorPending({
    required this.mentorId,
    required this.mentorName,
    required this.total,
    required this.invoices,
  });

  factory MentorPending.fromJson(Map<String, dynamic> json) {
    final rawInv = json['invoices'];
    final invoices = <PendingInvoiceRef>[];
    if (rawInv is List) {
      for (final i in rawInv) {
        if (i is Map) {
          invoices.add(PendingInvoiceRef.fromJson(i.cast<String, dynamic>()));
        }
      }
    }
    return MentorPending(
      mentorId: _str(json['_id']),
      mentorName: _str(json['mentorName']),
      total: _num(json['total']),
      invoices: invoices,
    );
  }
}

class PendingInvoiceRef {
  final String id;
  final String invoiceNumber;
  final num amount;

  const PendingInvoiceRef({
    required this.id,
    required this.invoiceNumber,
    required this.amount,
  });

  factory PendingInvoiceRef.fromJson(Map<String, dynamic> json) =>
      PendingInvoiceRef(
        id: _str(json['_id']),
        invoiceNumber: _str(json['invoiceNumber']),
        amount: _num(json['amount']),
      );
}

/// Server-side pricing preview (SRD billing engine).
class BookingQuote {
  final String source; // custom | default
  final num? perClassFee;
  final List<QuoteSubjectRate> subjectRates;
  final num estimatedAmount;
  final String estimateUnit; // per class | per hour
  final String billingNote;

  const BookingQuote({
    required this.source,
    required this.perClassFee,
    required this.subjectRates,
    required this.estimatedAmount,
    required this.estimateUnit,
    required this.billingNote,
  });

  factory BookingQuote.fromJson(Map<String, dynamic> json) {
    final rateCard = json['rateCard'];
    final rateMap = rateCard is Map ? rateCard : const {};
    final rawRates = rateMap['subjectRates'];
    final rates = <QuoteSubjectRate>[];
    if (rawRates is List) {
      for (final r in rawRates) {
        if (r is Map) {
          rates.add(QuoteSubjectRate.fromJson(r.cast<String, dynamic>()));
        }
      }
    }
    return BookingQuote(
      source: _str(rateMap['source']),
      perClassFee:
          rateMap['perClassFee'] == null ? null : _num(rateMap['perClassFee']),
      subjectRates: rates,
      estimatedAmount: _num(json['estimatedAmount']),
      estimateUnit: _str(json['estimateUnit']),
      billingNote: _str(json['billingNote']),
    );
  }
}

class QuoteSubjectRate {
  final String? subjectId;
  final String name;
  final num hourlyRate;

  const QuoteSubjectRate({
    required this.subjectId,
    required this.name,
    required this.hourlyRate,
  });

  factory QuoteSubjectRate.fromJson(Map<String, dynamic> json) =>
      QuoteSubjectRate(
        subjectId: json['subjectId'] == null ? null : _str(json['subjectId']),
        name: _str(json['name']),
        hourlyRate: _num(json['hourlyRate']),
      );
}
