import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/billing.dart';

/// Billing v2 (SRD): sessions, invoices and settlements.
class BillingService {
  final ApiClient _api = ApiClient.instance;

  // ---- Sessions & attendance ----

  /// Mentor: log a completed class session. [subjectId] is required for
  /// multiple-subject bookings.
  Future<void> logSession({
    required String bookingId,
    required String date, // "YYYY-MM-DD"
    required String startTime, // "HH:mm"
    required String endTime,
    String? subjectId,
    String? notes,
  }) async {
    final res = await _api.post(ApiConstants.sessions, data: {
      'bookingId': bookingId,
      'date': date,
      'startTime': startTime,
      'endTime': endTime,
      'subjectId': ?subjectId,
      'notes': ?notes,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to log the session.'));
    }
  }

  /// List sessions (role-filtered server-side). [status] = logged|verified|rejected.
  Future<SessionsPage> getSessions({
    String? status,
    String? bookingId,
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _api.get(ApiConstants.sessions, query: {
      'status': ?status,
      'bookingId': ?bookingId,
      'page': page,
      'limit': limit,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load sessions.'));
    }
    final body = res.data;
    final raw = (body is Map ? body['sessions'] : null);
    final sessions = <SessionRecord>[];
    if (raw is List) {
      for (final s in raw) {
        if (s is Map) {
          sessions.add(SessionRecord.fromJson(s.cast<String, dynamic>()));
        }
      }
    }
    final counts = (body is Map ? body['counts'] : null);
    final logged =
        (counts is Map && counts['logged'] is num) ? (counts['logged'] as num).toInt() : 0;
    final pagination = (body is Map ? body['pagination'] : null);
    return SessionsPage(
      sessions: sessions,
      loggedCount: logged,
      totalPages:
          (pagination is Map ? pagination['totalPages'] : 1) as int? ?? 1,
      currentPage:
          (pagination is Map ? pagination['currentPage'] : 1) as int? ?? 1,
    );
  }

  Future<void> updateSession(
    String sessionId, {
    String? date,
    String? startTime,
    String? endTime,
    String? notes,
  }) async {
    final res = await _api.patch(ApiConstants.sessionById(sessionId), data: {
      'date': ?date,
      'startTime': ?startTime,
      'endTime': ?endTime,
      'notes': ?notes,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to update the session.'));
    }
  }

  Future<void> deleteSession(String sessionId) async {
    final res = await _api.delete(ApiConstants.sessionById(sessionId));
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to delete the session.'));
    }
  }

  /// Admin: verify a logged session (also invoices it for per-session bookings).
  Future<void> verifySession(String sessionId) async {
    final res = await _api.patch(ApiConstants.verifySession(sessionId), data: {});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to verify the session.'));
    }
  }

  /// Admin: reject a logged session with an optional reason.
  Future<void> rejectSession(String sessionId, {String? reason}) async {
    final res = await _api
        .patch(ApiConstants.rejectSession(sessionId), data: {'reason': ?reason});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to reject the session.'));
    }
  }

  // ---- Invoices ----

  /// Admin: invoices by [scope] = all|due|overdue|paid|settled.
  Future<InvoicesPage> getInvoices({
    String scope = 'due',
    String search = '',
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _api.get(ApiConstants.invoices, query: {
      'scope': scope,
      'search': search,
      'page': page,
      'limit': limit,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load invoices.'));
    }
    final body = res.data;
    final raw = (body is Map ? body['invoices'] : null);
    final invoices = <InvoiceRecord>[];
    if (raw is List) {
      for (final i in raw) {
        if (i is Map) {
          invoices.add(InvoiceRecord.fromJson(i.cast<String, dynamic>()));
        }
      }
    }
    final counts = (body is Map ? body['counts'] : null);
    int countOf(String k) =>
        (counts is Map && counts[k] is num) ? (counts[k] as num).toInt() : 0;
    final pagination = (body is Map ? body['pagination'] : null);
    return InvoicesPage(
      invoices: invoices,
      due: countOf('due'),
      paid: countOf('paid'),
      settled: countOf('settled'),
      totalPages:
          (pagination is Map ? pagination['totalPages'] : 1) as int? ?? 1,
      currentPage:
          (pagination is Map ? pagination['currentPage'] : 1) as int? ?? 1,
    );
  }

  /// Student: my own invoices.
  Future<List<InvoiceRecord>> myInvoices() =>
      _invoiceList(ApiConstants.myInvoices);

  /// Mentor: invoices for my bookings + earnings summary.
  Future<MentorInvoices> mentorInvoices() async {
    final res = await _api.get(ApiConstants.mentorInvoices);
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load invoices.'));
    }
    final body = res.data;
    final raw = (body is Map ? body['invoices'] : null);
    final invoices = <InvoiceRecord>[];
    if (raw is List) {
      for (final i in raw) {
        if (i is Map) {
          invoices.add(InvoiceRecord.fromJson(i.cast<String, dynamic>()));
        }
      }
    }
    final summary = (body is Map ? body['summary'] : null);
    num sumOf(String k) =>
        (summary is Map && summary[k] is num) ? summary[k] as num : 0;
    return MentorInvoices(
      invoices: invoices,
      billed: sumOf('billed'),
      collected: sumOf('collected'),
      settled: sumOf('settled'),
    );
  }

  Future<List<InvoiceRecord>> _invoiceList(String path) async {
    final res = await _api.get(path);
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load invoices.'));
    }
    final raw = (res.data is Map ? res.data['invoices'] : null);
    final invoices = <InvoiceRecord>[];
    if (raw is List) {
      for (final i in raw) {
        if (i is Map) {
          invoices.add(InvoiceRecord.fromJson(i.cast<String, dynamic>()));
        }
      }
    }
    return invoices;
  }

  /// Admin: record a manual payment against an invoice (receipt auto-emailed).
  Future<void> recordInvoicePayment(
    String invoiceId, {
    String method = 'cash',
    String? note,
  }) async {
    final res = await _api.post(ApiConstants.invoicePayments(invoiceId),
        data: {'method': method, 'note': ?note});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to record the payment.'));
    }
  }

  Future<void> resendReceipt(String invoiceId) async {
    final res = await _api.post(ApiConstants.resendReceipt(invoiceId), data: {});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to resend the receipt.'));
    }
  }

  Future<void> voidInvoice(String invoiceId, {String? reason}) async {
    final res = await _api
        .post(ApiConstants.voidInvoice(invoiceId), data: {'reason': ?reason});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to void the invoice.'));
    }
  }

  /// Admin: close the current billing cycle early for a booking.
  Future<void> generateInvoice(String bookingId) async {
    final res = await _api
        .post(ApiConstants.generateInvoice, data: {'bookingId': bookingId});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to generate the invoice.'));
    }
  }

  // ---- Settlements ----

  /// Admin: settlements + paid-but-unsettled invoices grouped by mentor.
  Future<SettlementsPage> getSettlements({int page = 1, int limit = 20}) async {
    final res = await _api
        .get(ApiConstants.settlements, query: {'page': page, 'limit': limit});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load settlements.'));
    }
    final body = res.data;
    final rawSettle = (body is Map ? body['settlements'] : null);
    final settlements = <SettlementRecord>[];
    if (rawSettle is List) {
      for (final s in rawSettle) {
        if (s is Map) {
          settlements.add(SettlementRecord.fromJson(s.cast<String, dynamic>()));
        }
      }
    }
    final rawPending = (body is Map ? body['pendingByMentor'] : null);
    final pending = <MentorPending>[];
    if (rawPending is List) {
      for (final p in rawPending) {
        if (p is Map) {
          pending.add(MentorPending.fromJson(p.cast<String, dynamic>()));
        }
      }
    }
    return SettlementsPage(settlements: settlements, pendingByMentor: pending);
  }

  /// Mentor: my received payouts + total.
  Future<MentorSettlements> mentorSettlements() async {
    final res = await _api.get(ApiConstants.mentorSettlements);
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to load payouts.'));
    }
    final body = res.data;
    final raw = (body is Map ? body['settlements'] : null);
    final settlements = <SettlementRecord>[];
    if (raw is List) {
      for (final s in raw) {
        if (s is Map) {
          settlements.add(SettlementRecord.fromJson(s.cast<String, dynamic>()));
        }
      }
    }
    final total =
        (body is Map && body['totalReceived'] is num) ? body['totalReceived'] as num : 0;
    return MentorSettlements(settlements: settlements, totalReceived: total);
  }

  /// Admin: record a direct payout to a mentor (no commission).
  Future<void> createSettlement({
    required String mentorId,
    required List<String> invoiceIds,
    num? amount,
    String method = 'bank-transfer',
    String? reference,
    String? note,
  }) async {
    final res = await _api.post(ApiConstants.settlements, data: {
      'mentorId': mentorId,
      'invoiceIds': invoiceIds,
      'amount': ?amount,
      'method': method,
      'reference': ?reference,
      'note': ?note,
    });
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to record the payout.'));
    }
  }

  Future<void> voidSettlement(String settlementId, {String? reason}) async {
    final res = await _api.post(ApiConstants.voidSettlement(settlementId),
        data: {'reason': ?reason});
    if (!ApiClient.isOk(res)) {
      throw ApiException(ApiClient.messageFor(res, 'Unable to void the settlement.'));
    }
  }
}

class SessionsPage {
  final List<SessionRecord> sessions;
  final int loggedCount;
  final int totalPages;
  final int currentPage;
  const SessionsPage({
    required this.sessions,
    required this.loggedCount,
    required this.totalPages,
    required this.currentPage,
  });
}

class InvoicesPage {
  final List<InvoiceRecord> invoices;
  final int due;
  final int paid;
  final int settled;
  final int totalPages;
  final int currentPage;
  const InvoicesPage({
    required this.invoices,
    required this.due,
    required this.paid,
    required this.settled,
    required this.totalPages,
    required this.currentPage,
  });
}

class MentorInvoices {
  final List<InvoiceRecord> invoices;
  final num billed;
  final num collected;
  final num settled;
  const MentorInvoices({
    required this.invoices,
    required this.billed,
    required this.collected,
    required this.settled,
  });
}

class SettlementsPage {
  final List<SettlementRecord> settlements;
  final List<MentorPending> pendingByMentor;
  const SettlementsPage({
    required this.settlements,
    required this.pendingByMentor,
  });
}

class MentorSettlements {
  final List<SettlementRecord> settlements;
  final num totalReceived;
  const MentorSettlements({
    required this.settlements,
    required this.totalReceived,
  });
}
