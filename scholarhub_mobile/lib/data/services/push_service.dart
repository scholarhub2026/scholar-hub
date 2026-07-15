import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import 'notification_router.dart';

/// Background message handler — must be a top-level (or static) function so it
/// can run in its own isolate when the app is terminated/backgrounded.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // The OS displays the notification automatically; add custom work here later.
}

/// Wraps FCM: requests permission, obtains the device token and keeps it synced
/// with the signed-in user via the backend, displays foreground notifications,
/// and forwards notification taps to [NotificationRouter] so the app navigates
/// to the screen the push is about. Every method is a safe no-op when Firebase
/// isn't configured yet, so the app runs fine before push is set up.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  static const _channelId = 'scholarhub_default';
  static const _channelName = 'General';

  final ApiClient _api = ApiClient.instance;
  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  String? _token;
  String? _lastUserId;
  bool _ready = false;

  /// Call once after `Firebase.initializeApp()`.
  Future<void> init() async {
    try {
      final messaging = FirebaseMessaging.instance;

      await messaging.requestPermission(alert: true, badge: true, sound: true);
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      await _initLocalNotifications();

      // iOS shows its own banner while the app is foregrounded; Android needs
      // the local-notifications plugin for that (see the onMessage listener).
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // Foreground pushes: display a banner ourselves on Android.
      FirebaseMessaging.onMessage.listen(_onForegroundMessage);

      // App was BACKGROUND and the user tapped the system notification.
      FirebaseMessaging.onMessageOpenedApp
          .listen(NotificationRouter.instance.handleMessage);

      // App was TERMINATED and was launched by tapping a notification.
      final initial = await messaging.getInitialMessage();
      if (initial != null) {
        NotificationRouter.instance.handleMessage(initial);
      }

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

  Future<void> _initLocalNotifications() async {
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        // FCM's requestPermission already asked; don't prompt twice.
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );

    await _local.initialize(
      settings,
      // Tap on a banner we displayed while the app was foregrounded.
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        try {
          final data = (jsonDecode(payload) as Map)
              .map((k, v) => MapEntry(k.toString(), v.toString()));
          NotificationRouter.instance.handleData(data);
        } catch (e) {
          debugPrint('[push] bad tap payload: $e');
        }
      },
    );

    if (Platform.isAndroid) {
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(
            const AndroidNotificationChannel(
              _channelId,
              _channelName,
              description: 'Booking updates and account alerts',
              importance: Importance.high,
            ),
          );
      // Android 13+ runtime notification permission.
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    }
  }

  /// Show a banner for pushes that arrive while the app is open (Android only —
  /// iOS presents them natively via the foreground options set in [init]).
  Future<void> _onForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null || !Platform.isAndroid) return;

    await _local.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: 'Booking updates and account alerts',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: jsonEncode(message.data),
    );
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
