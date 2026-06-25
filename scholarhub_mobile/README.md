# Scholar Hub — Mobile App (Flutter)

A native Flutter port of the [scholarhub.live](https://www.scholarhub.live) mentor-booking
platform, with a modern, Gen-Z visual language built from scratch. It talks to the
same backend as the website.

## ✨ What's inside

| Area | Screen(s) |
|------|-----------|
| **Home** | Animated hero (uses the site's `home.jpeg`), Features, How-It-Works, Popular Subjects, Testimonials carousel, CTA, Footer |
| **Mentors** | Searchable + syllabus-filterable mentor list, rich mentor cards, full mentor detail with stats/classes/subjects/availability/about |
| **Booking** | 4-step wizard — Plan (syllabus → class → booking type → subjects, live total) → Details → Review → Confirmation, with Razorpay payment link |
| **Auth** | Login, Signup, Email OTP verification, persistent JWT session, Update Password |
| **Forms** | "Enquiry Now" and "Become a Mentor" lead bottom-sheets with success state |
| **Account** | Profile, My Bookings (with status/payment chips), logout, info pages |
| **Info** | About, Contact, Terms, Privacy, Cookies, Cancellations & Refunds, Service Delivery |

## 🏗 Architecture

```
lib/
  core/            theme, colors, constants (API + copy), Dio client, navigation, utils
  data/
    models/        AppUser, Mentor (+ nested class/subject), Booking, BookingDraft, catalog
    services/      auth, mentor, booking, catalog, inquiry  (thin API wrappers)
  state/           AuthProvider (Provider + shared_preferences token persistence)
  widgets/         shared UI primitives (buttons, cards, text fields, states, footer…)
  features/        home, mentors, booking, auth, forms, bookings, profile, info, shell
```

- **State:** `provider` for auth/session; screens load via service calls + local state.
- **Networking:** `dio` with a bearer-token interceptor → `ApiClient`.
- **Design:** Google Fonts (Sora + Plus Jakarta Sans), `flutter_animate`, gradient brand
  system, `lucide_icons`, `cached_network_image`, shimmer skeletons.

## 🔌 Backend

Base URL lives in `lib/core/constants/api_constants.dart`:

```dart
static const String baseUrl =
    'https://backend-production-59ab.up.railway.app/api';
```

To run against a local backend, change it to `http://10.0.2.2:3000/api`
(Android emulator) or your machine's LAN IP. Razorpay uses the project's test key.

## ▶️ Run

```bash
cd scholarhub_mobile
flutter pub get
flutter run            # device / emulator
```

Endpoints consumed: `/auth/login`, `/auth/signin`, `/auth/verify/:id`,
`/auth/verify-token`, `/auth/:id`, `/mentor`, `/classes`, `/subject/:type`,
`/booking`, `/booking/create-payment-link`, `/booking/:studentId`, `/inquery-form`.

## 🎨 Assets

`home.jpeg`, `og-image.png` and the school icon are taken from the web frontend's
`public/` folder. The logo/illustrations are rendered with custom gradient + icon
widgets (no external image needed).

> Note: the admin dashboard is intentionally **out of scope** — this is the
> student/consumer app. The path contains a space (`Scholar Hub`); if Android Gradle
> complains, build from a space-free path.
