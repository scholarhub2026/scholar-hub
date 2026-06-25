import 'package:intl/intl.dart';

/// Shared formatting helpers (currency, dates, time slots).
class Formatters {
  Formatters._();

  static final NumberFormat _currency = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static String rupees(num? amount) => _currency.format(amount ?? 0);

  static String rupeesPlain(num? amount) =>
      '₹${(amount ?? 0).toStringAsFixed(0)}';

  /// Mentor `available_slot` items may arrive as an ISO timestamp or already
  /// formatted ("2:30 PM"). Normalise both to "h:mm a".
  static String slotLabel(String raw) {
    if (raw.trim().isEmpty) return raw;
    final parsed = DateTime.tryParse(raw);
    if (parsed != null) {
      return DateFormat('h:mm a').format(parsed.toLocal());
    }
    return raw;
  }

  static String date(DateTime? value) {
    if (value == null) return '—';
    return DateFormat('d MMM yyyy').format(value.toLocal());
  }

  static String dateTime(DateTime? value) {
    if (value == null) return '—';
    return DateFormat('d MMM yyyy · h:mm a').format(value.toLocal());
  }

  static String initials(String? first, [String? last]) {
    final f = (first ?? '').trim();
    final l = (last ?? '').trim();
    final a = f.isNotEmpty ? f[0] : '';
    final b = l.isNotEmpty ? l[0] : (f.length > 1 ? f[1] : '');
    final result = (a + b).toUpperCase();
    return result.isEmpty ? 'SH' : result;
  }

  /// Strips simple HTML tags from rich-text bio fields for plain display.
  static String stripHtml(String? html) {
    if (html == null) return '';
    return html
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .trim();
  }
}
