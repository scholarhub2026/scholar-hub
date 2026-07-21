import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Session storage split by sensitivity: JWTs live in [FlutterSecureStorage]
/// (Keychain / Android Keystore-backed), non-sensitive UX data (cached user
/// JSON, flags) in [SharedPreferences]. Tokens are cached in memory after
/// [load] so the request interceptor can read them synchronously.
class LocalStorageService {
  LocalStorageService._();
  static final LocalStorageService instance = LocalStorageService._();

  static const _kAccess = 'sh_access_token';
  static const _kRefresh = 'sh_refresh_token';
  static const _kUser = 'sh_user';
  // Legacy plaintext token key (pre-secure-storage) — migrated away on load.
  static const _kLegacyToken = 'sh_token';

  final FlutterSecureStorage _secure = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  String? _accessToken;
  String? _refreshToken;

  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  bool get hasSession => (_accessToken ?? '').isNotEmpty;

  /// Load tokens into memory (call once at boot before the app makes requests).
  /// Migrates a legacy plaintext `sh_token` from SharedPreferences into secure
  /// storage on first run after upgrade.
  Future<void> load() async {
    _accessToken = await _secure.read(key: _kAccess);
    _refreshToken = await _secure.read(key: _kRefresh);

    if ((_accessToken ?? '').isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      final legacy = prefs.getString(_kLegacyToken);
      if (legacy != null && legacy.isNotEmpty) {
        _accessToken = legacy;
        await _secure.write(key: _kAccess, value: legacy);
        await prefs.remove(_kLegacyToken);
      }
    }
  }

  Future<void> setTokens({String? access, String? refresh}) async {
    if (access != null) {
      _accessToken = access;
      await _secure.write(key: _kAccess, value: access);
    }
    if (refresh != null && refresh.isNotEmpty) {
      _refreshToken = refresh;
      await _secure.write(key: _kRefresh, value: refresh);
    }
  }

  /// Clear the whole session (logout / definitive token rejection).
  Future<void> clearSession() async {
    _accessToken = null;
    _refreshToken = null;
    await _secure.delete(key: _kAccess);
    await _secure.delete(key: _kRefresh);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kUser);
  }

  // ---- Non-sensitive cached user JSON (SharedPreferences) ----
  Future<void> setUserJson(String json) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kUser, json);
  }

  Future<String?> getUserJson() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kUser);
  }
}
