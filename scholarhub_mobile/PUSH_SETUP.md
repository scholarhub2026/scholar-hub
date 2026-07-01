# Push notifications — setup

The Dart/Flutter side is done: `PushService` requests permission, gets the FCM
token and registers it with the backend (`PUT /auth/fcm-token/:id`) whenever a
user signs in. When a booking is created the backend pushes to the mentor and
all admins.

Until the Firebase **native config** below is added, the app still runs — push
is simply disabled (`Firebase.initializeApp()` fails and is caught in
`main.dart`). Once configured, notifications start working with no code change.

## 1. Firebase project
1. Create a project at <https://console.firebase.google.com>.
2. **Backend credential:** Project settings → Service accounts → *Generate new
   private key*. Set the JSON as the `FIREBASE_SERVICE_ACCOUNT` env var on
   Railway (already wired in `backend/src/utils/firebase.ts`).

## 2. Android
1. In Firebase, add an Android app with the package name from
   `android/app/build.gradle` (`applicationId`).
2. Download `google-services.json` → place in `scholarhub_mobile/android/app/`.
3. In `android/build.gradle` (project-level) add to `dependencies`:
   `classpath 'com.google.gms:google-services:4.4.2'`
4. In `android/app/build.gradle` add at the top-level plugins:
   `apply plugin: 'com.google.gms.google-services'`
5. `minSdkVersion` must be ≥ 21 (already set).

## 3. iOS
1. In Firebase, add an iOS app with the bundle ID from Xcode.
2. Download `GoogleService-Info.plist` → add to `Runner` in Xcode (drag into the
   Runner target so it's bundled).
3. Xcode → Runner → Signing & Capabilities → add **Push Notifications** and
   **Background Modes → Remote notifications**.
4. Create an APNs auth key (Apple developer account) and upload it in Firebase →
   Project settings → Cloud Messaging → Apple app configuration.

## Shortcut
Instead of steps 2–3 you can run `flutterfire configure` (installs the FlutterFire
CLI, registers both platforms and writes native config). If you use it, it also
generates `lib/firebase_options.dart`; then change `main.dart` to
`Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`.

## Test
1. Sign in on a device → backend stores the token in `fcmTokens`.
2. Create a booking → the booked mentor and every admin get a notification.
