import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../models/mentor.dart';

/// A mentor's bookable availability, as returned by
/// `GET /mentor/:id/availability` — each slot annotated with remaining seats.
class MentorAvailability {
  final bool isAvailable;
  final List<AvailabilitySlot> slots;

  const MentorAvailability({required this.isAvailable, required this.slots});

  bool get isEmpty => slots.isEmpty;
}

/// Reads and writes a mentor's weekly availability template.
class AvailabilityService {
  final ApiClient _api = ApiClient.instance;

  /// Public: slots + per-slot remaining seats for the booking flow.
  Future<MentorAvailability> getAvailability(String mentorId) async {
    final res = await _api.get(ApiConstants.mentorAvailability(mentorId));
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to load availability.'));
    }
    final body = res.data;
    final rawSlots = body is Map ? body['slots'] : null;
    final slots = <AvailabilitySlot>[];
    if (rawSlots is List) {
      for (final s in rawSlots) {
        if (s is Map) {
          slots.add(AvailabilitySlot.fromJson(s.cast<String, dynamic>()));
        }
      }
    }
    return MentorAvailability(
      isAvailable: body is Map ? body['is_available'] != false : true,
      slots: slots,
    );
  }

  /// Mentor/Admin: replace the weekly template and/or toggle accepting bookings.
  Future<void> updateWeeklyAvailability(
    String mentorId, {
    List<AvailabilitySlot>? slots,
    bool? isAvailable,
  }) async {
    final data = <String, dynamic>{};
    if (slots != null) {
      data['weekly_availability'] = slots.map((s) => s.toJson()).toList();
    }
    if (isAvailable != null) data['is_available'] = isAvailable;

    final res = await _api.put(
      ApiConstants.mentorAvailability(mentorId),
      data: data,
    );
    if (!ApiClient.isOk(res)) {
      throw ApiException(
          ApiClient.messageFor(res, 'Unable to save availability.'));
    }
  }
}
