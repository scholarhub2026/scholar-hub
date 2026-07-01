import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';

/// Background message handler — must be a top-level (or static) function so it
/// can run in its own isolate when the app is terminated/backgrounded.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // The OS displays the notification automatically; add custom work here later.
}

/// Wraps FCM: requests permission, obtains the device token and keeps it synced
/// with the signed-in user via the backend. Every method is a safe no-op when
/// Firebase isn't configured yet, so the app runs fine before push is set up.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  final ApiClient _api = ApiClient.instance;

  String? _token;
  String? _lastUserId;
  bool _ready = false;

  /// Call once after `Firebase.initializeApp()`.
  Future<void> init() async {
    try {
      final messaging = FirebaseMessaging.instance;

      await messaging.requestPermission(alert: true, badge: true, sound: true);
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      _token = await messaging.getToken();
      messaging.onTokenRefresh.listen((token) {
        _token = token;
        final userId = _lastUserId;
        if (userId != null) _register(userId, token);
      });

      _ready = true;
      debugPrint('[push] ready (token: ${_token != null})');
    } catch (e) {
      _ready = false;
      debugPrint('[push] init skipped — Firebase not configured: $e');
    }
  }

  /// Associate this device's token with a signed-in user.
  Future<void> syncToken(String userId) async {
    _lastUserId = userId;
    final token = _token;
    if (!_ready || token == null) return;
    await _register(userId, token);
  }

  /// Detach this device on logout so it stops receiving pushes.
  Future<void> clearToken(String userId) async {
    _lastUserId = null;
    final token = _token;
    if (!_ready || token == null) return;
    try {
      await _api.delete(ApiConstants.fcmToken(userId), data: {'token': token});
    } catch (e) {
      debugPrint('[push] token clear failed: $e');
    }
  }

  Future<void> _register(String userId, String token) async {
    try {
      await _api.put(ApiConstants.fcmToken(userId), data: {'token': token});
    } catch (e) {
      debugPrint('[push] token register failed: $e');
    }
  }
}
