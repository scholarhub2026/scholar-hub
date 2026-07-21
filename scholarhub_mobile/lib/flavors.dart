/// Build flavors (dev / prod). Dart-only — the flavor is chosen by the
/// entrypoint (`main_dev.dart` / `main_prod.dart`), which sets [F.appFlavor]
/// before the shared `main()` runs. Everything flavor-varying (base URL, app
/// title, banners) reads from [F].
enum Flavor { dev, prod }

class F {
  F._();

  static Flavor appFlavor = Flavor.prod;

  static bool get isDev => appFlavor == Flavor.dev;
  static String get name => appFlavor.name;
  static String get title => isDev ? 'Scholar Hub Dev' : 'Scholar Hub';

  /// Backend base URL per flavor (must end in `/api`).
  /// - dev  → the backend running the latest code (web backend).
  /// - prod → the backend the shipped app currently targets.
  /// NOTE: confirm which Railway backend each flavor should point at.
  static String get baseUrl => isDev
      ? 'https://scholar-hub-production.up.railway.app/api'
      : 'https://backend-production-59ab.up.railway.app/api';
}
