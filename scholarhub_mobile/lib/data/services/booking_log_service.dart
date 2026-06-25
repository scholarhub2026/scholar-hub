import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/booking_log.dart';

/// Session logs attached to a booking (mentor "My Schedule").
class BookingLogService {
  final ApiClient _api = ApiClient.instance;

  Future<List<BookingLog>> getLogs(String bookingId) async {
    final res = await _api.get(ApiConstants.bookingLog(bookingId));
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load session logs.'));
    }
    final body = res.data;
    final raw = body is Map ? body['bookingLogs'] : null;
    final logs = <BookingLog>[];
    if (raw is List) {
      for (final l in raw) {
        if (l is Map) {
          logs.add(BookingLog.fromJson(l.cast<String, dynamic>()));
        }
      }
    }
    return logs;
  }

  Future<void> createLog(
    String bookingId, {
    required String date,
    required String startTime,
    required String endTime,
  }) async {
    final res = await _api.post(
      ApiConstants.bookingLog(bookingId),
      data: {'date': date, 'startTime': startTime, 'endTime': endTime},
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to add the session log.'));
    }
  }
}
