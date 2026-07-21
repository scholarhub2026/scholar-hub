import 'package:get_it/get_it.dart';

import '../../data/repositories/auth_repository.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/booking_service.dart';
import '../../data/services/enquiry_service.dart';
import '../../data/services/mentor_service.dart';
import '../network/api_client.dart';
import '../storage/local_storage_service.dart';

/// Global service locator. Resolve dependencies anywhere via `sl<Type>()`.
final GetIt sl = GetIt.instance;

/// Registers app-wide singletons. Call once at boot (after
/// `LocalStorageService.load()`), before `runApp`.
Future<void> setupServiceLocator() async {
  sl
    // Infra
    ..registerSingleton<LocalStorageService>(LocalStorageService.instance)
    ..registerSingleton<ApiClient>(ApiClient.instance)
    // Repositories (abstract → impl). Flagship clean-arch example: auth.
    ..registerLazySingleton<AuthRepository>(AuthService.new)
    // Key shared services via DI (interfaces are the incremental next step).
    ..registerLazySingleton<MentorService>(MentorService.new)
    ..registerLazySingleton<BookingService>(BookingService.new)
    ..registerLazySingleton<EnquiryService>(EnquiryService.new);
}
