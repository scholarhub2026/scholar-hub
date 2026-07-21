import 'flavors.dart';
import 'main.dart' as runner;

/// Dev entrypoint: `flutter run -t lib/main_dev.dart`.
Future<void> main() async {
  F.appFlavor = Flavor.dev;
  await runner.main();
}
