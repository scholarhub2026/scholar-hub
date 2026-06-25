import 'package:flutter/material.dart';

/// Scholar Hub brand palette.
///
/// Derived from the web theme (primary blue `hsl(221 83% 53%)`, secondary
/// `#1E40AF`, accent orange `#F97316`) and extended with a Gen-Z gradient set
/// for a more vivid, modern mobile feel.
class AppColors {
  AppColors._();

  // Brand core
  static const Color primary = Color(0xFF2563EB); // blue-600
  static const Color primaryDark = Color(0xFF1E40AF); // blue-800 (secondary)
  static const Color primaryLight = Color(0xFFEFF6FF); // mentor.light
  static const Color indigo = Color(0xFF4F46E5);
  static const Color violet = Color(0xFF7C3AED);
  static const Color accent = Color(0xFFF97316); // orange-500
  static const Color accentSoft = Color(0xFFFFF1E6);

  // Surfaces
  static const Color background = Color(0xFFF7F9FF);
  static const Color surface = Colors.white;
  static const Color surfaceMuted = Color(0xFFF1F5FB);
  static const Color surfaceAlt = Color(0xFFEEF2FF);

  // Text
  static const Color textPrimary = Color(0xFF0F172A); // slate-900
  static const Color textSecondary = Color(0xFF475569); // slate-600
  static const Color textMuted = Color(0xFF94A3B8); // slate-400
  static const Color onPrimary = Colors.white;

  // Lines & states
  static const Color border = Color(0xFFE2E8F0);
  static const Color success = Color(0xFF16A34A);
  static const Color successSoft = Color(0xFFDCFCE7);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerSoft = Color(0xFFFEE2E2);
  static const Color star = Color(0xFFF59E0B);

  // Gradients
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2563EB), Color(0xFF4F46E5), Color(0xFF7C3AED)],
  );

  static const LinearGradient blueGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E40AF), Color(0xFF2563EB)],
  );

  static const LinearGradient sunsetGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF97316), Color(0xFFFB7185)],
  );

  static const LinearGradient heroGlow = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFEEF2FF), Color(0xFFF7F9FF)],
  );

  // Subject accent swatches (background, foreground) mirroring the web cards.
  static const List<List<Color>> subjectSwatches = [
    [Color(0xFFEFF6FF), Color(0xFF1D4ED8)], // blue
    [Color(0xFFECFDF5), Color(0xFF047857)], // green
    [Color(0xFFF5F3FF), Color(0xFF6D28D9)], // purple
    [Color(0xFFFFFBEB), Color(0xFFB45309)], // amber
    [Color(0xFFFFF1F2), Color(0xFFBE123C)], // rose
    [Color(0xFFFFF7ED), Color(0xFFC2410C)], // orange
    [Color(0xFFEEF2FF), Color(0xFF4338CA)], // indigo
    [Color(0xFFECFEFF), Color(0xFF0E7490)], // cyan
  ];
}
