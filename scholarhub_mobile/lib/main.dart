import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'app.dart';
import 'data/services/push_service.dart';
import 'state/auth/auth_cubit.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Push notifications are optional at boot: if Firebase native config is
  // missing the app still launches, just without notifications.
  try {
    await Firebase.initializeApp();
    await PushService.instance.init();
  } catch (e) {
    debugPrint('[push] Firebase not configured yet: $e');
  }

  runApp(
    BlocProvider(
      create: (_) => AuthCubit()..bootstrap(),
      child: const ScholarHubApp(),
    ),
  );
}
