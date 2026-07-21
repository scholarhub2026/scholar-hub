/// A user-facing error surfaced by the networking layer. Services throw this on
/// a non-OK response; cubits map it to a failure state / snackbar.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  const ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}
