# Push notifications — setup

**The code is done.** Role-based push + tap-to-navigate is fully implemented on
both the app and the backend. All that remains are the **Firebase account steps
below** (config files + keys) — no more code changes needed.

## What's already built

**App (`scholarhub_mobile`)**
- `PushService` requests permission, gets the FCM token, and registers it with
  the backend (`PUT /auth/fcm-token/:id`) on login / relaunch; removes it on
  logout.
- Foreground pushes show a banner (`flutter_local_notifications`); background &
  terminated pushes are shown by the OS.
- Tapping a notification routes to the right screen **for the signed-in role**
  via `NotificationRouter` + a root `navigatorKey` — works from cold start too.

**Backend** — every push carries a `type` the app routes on:

| Event | Who gets it | `type` | Opens |
|---|---|---|---|
| New booking created | the mentor | `booking` | Mentor → Schedule |
| New booking created | all admins | `booking` | Admin → Bookings |
| Payment confirmed | the student | `booking` | Student → Bookings |
| Mentor approved | that mentor | `mentor_approved` | Mentor → Dashboard |
| New enquiry submitted | all admins | `inquiry` | Admin → Enquiries |

Until the native config below is added, the app still runs — push is just
disabled (`Firebase.initializeApp()` fails and is caught in `main.dart`).

---

## 1. Firebase project (5 min)
1. Create a project at <https://console.firebase.google.com>.
2. **Backend credential:** Project settings → *Service accounts* → **Generate new
   private key** → download the JSON.
3. On **Railway** → backend service → Variables, add **`FIREBASE_SERVICE_ACCOUNT`**
   = the entire JSON (paste as one line). This is already wired in
   `backend/src/utils/firebase.ts` — without it the backend silently sends no
   pushes.

## 2. Android
1. Firebase → Add app → **Android**. Package name: **`com.scholarhub.scholarhub`**.
2. Download **`google-services.json`** → drop it in
   `scholarhub_mobile/android/app/`.
   *(That's it — the Gradle plugin auto-activates when the file is present; it's
   wired conditionally in `android/app/build.gradle.kts` so builds work without
   it too.)*

## 3. iOS
1. Firebase → Add app → **iOS**. Use the bundle ID from Xcode (Runner target).
2. Download **`GoogleService-Info.plist`** → in Xcode, drag it into the **Runner**
   target (check "Copy items if needed" so it's bundled).
3. Xcode → Runner → **Signing & Capabilities** → **+ Capability** → add
   **Push Notifications** and **Background Modes → Remote notifications**.
   *(The `UIBackgroundModes` plist entry is already added.)*
4. Create an **APNs auth key** (Apple Developer → Keys) and upload it in Firebase
   → Project settings → **Cloud Messaging** → *Apple app configuration*. Required
   or iOS pushes won't deliver.

### Shortcut for steps 2–3
`flutterfire configure` (needs the FlutterFire CLI) registers both platforms and
writes the config files for you. If used, it also generates
`lib/firebase_options.dart` — then change `main.dart` to
`Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`.

---

## Local build note (this dev machine)
A full local Android build currently needs **JDK 17** (the machine has JDK 25,
which the Android/Kotlin toolchain can't parse):
```
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
```
Also unrelated to push: `lucide_icons 0.257.0` doesn't compile against the very
new Flutter 3.44.5 (it extends the now-`final` `IconData`) — bump/replace it if
you build on this Flutter version.

## Test it
1. Add the config files + `FIREBASE_SERVICE_ACCOUNT`, redeploy the backend.
2. Sign in on a device (grants notification permission; token registers).
3. Trigger an event — e.g. submit an enquiry from the web → the signed-in
   **admin** phone gets a push → tapping it opens **Enquiries**.
4. Foreground, background, and killed-app taps should all land on the right tab.
