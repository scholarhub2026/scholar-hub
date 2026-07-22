import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'app.dart';
import 'core/di/service_locator.dart';
import 'core/storage/local_storage_service.dart';
import 'data/services/push_service.dart';
import 'firebase_options.dart';
import 'state/auth/auth_cubit.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Load persisted tokens (secure storage) + wire dependencies before anything
  // makes a request. Guarded + time-boxed so a storage/DI hiccup degrades to a
  // signed-out start instead of a white screen.
  try {
    await LocalStorageService.instance.load().timeout(
          const Duration(seconds: 6),
          onTimeout: () => debugPrint('[boot] storage load timed out'),
        );
    await setupServiceLocator();
  } catch (e, s) {
    debugPrint('[boot] init failed: $e\n$s');
  }

  // Render immediately — do NOT block the first frame on Firebase. On some
  // devices/simulators Firebase.initializeApp() can hang; push is optional, so
  // it's initialized in the background after the app is on screen.
  runApp(
    BlocProvider(
      create: (_) => AuthCubit()..bootstrap(),
      child: const ScholarHubApp(),
    ),
  );

  unawaited(_initPushInBackground());
}

/// Best-effort Firebase + push init, off the startup path. Never throws.
Future<void> _initPushInBackground() async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    ).timeout(const Duration(seconds: 10));
    await PushService.instance.init().timeout(const Duration(seconds: 10));
  } catch (e) {
    debugPrint('[push] Firebase init skipped: $e');
  }
}
