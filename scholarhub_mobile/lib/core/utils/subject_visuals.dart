import 'package:flutter/widgets.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Best-effort keyword mapping from a subject name to a fitting icon.
IconData subjectIcon(String raw) {
  final n = raw.toLowerCase();
  bool has(String k) => n.contains(k);
  if (has('math')) return LucideIcons.calculator;
  if (has('physic')) return LucideIcons.atom;
  if (has('chem')) return LucideIcons.testTube;
  if (has('bio')) return LucideIcons.dna;
  if (has('history')) return LucideIcons.landmark;
  if (has('geograph')) return LucideIcons.map;
  if (has('econom')) return LucideIcons.trendingUp;
  if (has('politic') || has('civic')) return LucideIcons.scale;
  if (has('social')) return LucideIcons.globe2;
  if (has('comput') || has('coding')) return LucideIcons.code;
  if (has('music')) return LucideIcons.music;
  if (has('art') || has('draw')) return LucideIcons.palette;
  if (has('hindi') ||
      has('english') ||
      has('malayalam') ||
      has('language') ||
      has('sanskrit')) {
    return LucideIcons.languages;
  }
  if (has('test') || has('prep')) return LucideIcons.clipboardCheck;
  if (has('science')) return LucideIcons.flaskConical;
  return LucideIcons.bookOpen;
}

/// Title-cases a (often lowercase) subject name for display.
String subjectTitle(String s) => s
    .split(' ')
    .where((w) => w.isNotEmpty)
    .map((w) => w[0].toUpperCase() + w.substring(1))
    .join(' ');
