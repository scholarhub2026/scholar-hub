import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

/// A notification the user tapped, waiting to be routed to a screen.
///
/// The backend attaches a `type` to every push (`booking`, `inquiry`,
/// `mentor_approved`, …) plus optional ids. Each role shell listens to
/// [NotificationRouter.pending] and maps the type onto one of ITS tabs — the
/// same `booking` push lands on Admin → Bookings, Mentor → Schedule or
/// Student → Bookings depending on who is signed in on this device.
@immutable
class PendingNotification {
  const PendingNotification(this.type, this.data);

  final String type;
  final Map<String, String> data;
}

/// Routes notification taps to the right screen.
///
/// Works for all three launch states:
///  * terminated  — `FirebaseMessaging.getInitialMessage()` in [PushService]
///  * background  — `onMessageOpenedApp`
///  * foreground  — tap on the local notification banner
/// All three call [handleMessage]/[handleData]; the shells consume the result.
class NotificationRouter {
  NotificationRouter._();
  static final NotificationRouter instance = NotificationRouter._();

  /// Root navigator so we can pop any pushed screens (e.g. a mentor detail)
  /// before switching tabs — otherwise the switch happens invisibly underneath.
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// The last tapped-but-not-yet-routed notification. Shells listen to this,
  /// route it, then call [consume]. Also survives cold starts: the value is
  /// set before the shell is built and picked up on its first frame.
  final ValueNotifier<PendingNotification?> pending = ValueNotifier(null);

  void handleMessage(RemoteMessage message) {
    handleData(message.data.map((k, v) => MapEntry(k, v.toString())));
  }

  void handleData(Map<String, String> data) {
    final type = data['type'];
    if (type == null || type.isEmpty) return;
    debugPrint('[push] tapped: type=$type data=$data');

    // Bring the shell to the front so the tab switch is visible.
    navigatorKey.currentState?.popUntil((route) => route.isFirst);
    pending.value = PendingNotification(type, data);
  }

  void consume() => pending.value = null;
}
