import 'package:flutter/material.dart';

/// The Scholar Hub brand logo (transparent PNG).
///
/// By default it renders bare (no background) so it sits cleanly on light
/// surfaces. Set [tile] to true to wrap it in a soft white rounded tile for
/// use on the brand gradient, where the blue logo would otherwise lack
/// contrast.
class AppLogo extends StatelessWidget {
  final double height;
  final bool tile;

  const AppLogo({super.key, this.height = 48, this.tile = false});

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      'assets/images/logo.png',
      height: height,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
    );

    if (!tile) return image;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: height * 0.34,
        vertical: height * 0.3,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(height * 0.42),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: image,
    );
  }
}
