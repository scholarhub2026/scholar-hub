import 'flavors.dart';
import 'main.dart' as runner;

/// Prod entrypoint: `flutter run -t lib/main_prod.dart` (also the default when
/// running plain `lib/main.dart`).
Future<void> main() async {
  F.appFlavor = Flavor.prod;
  await runner.main();
}
