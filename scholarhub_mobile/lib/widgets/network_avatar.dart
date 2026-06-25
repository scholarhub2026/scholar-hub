import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// Circular avatar that loads a network image and falls back to gradient
/// initials when the URL is missing or fails.
class NetworkAvatar extends StatelessWidget {
  final String? imageUrl;
  final String initials;
  final double size;

  const NetworkAvatar({
    super.key,
    required this.imageUrl,
    required this.initials,
    this.size = 56,
  });

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      height: size,
      width: size,
      decoration: const BoxDecoration(
        gradient: AppColors.brandGradient,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.36,
        ),
      ),
    );

    if (imageUrl == null || imageUrl!.trim().isEmpty) return placeholder;

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: imageUrl!,
        height: size,
        width: size,
        fit: BoxFit.cover,
        placeholder: (_, _) => placeholder,
        errorWidget: (_, _, _) => placeholder,
      ),
    );
  }
}

/// Rectangular cover image with rounded corners + gradient fallback.
class CoverImage extends StatelessWidget {
  final String? imageUrl;
  final double height;
  final double radius;
  final Widget? overlay;

  const CoverImage({
    super.key,
    required this.imageUrl,
    this.height = 200,
    this.radius = 24,
    this.overlay,
  });

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      height: height,
      decoration: const BoxDecoration(gradient: AppColors.brandGradient),
    );

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Stack(
        fit: StackFit.passthrough,
        children: [
          if (imageUrl == null || imageUrl!.trim().isEmpty)
            fallback
          else
            CachedNetworkImage(
              imageUrl: imageUrl!,
              height: height,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (_, _) => fallback,
              errorWidget: (_, _, _) => fallback,
            ),
          if (overlay != null) Positioned.fill(child: overlay!),
        ],
      ),
    );
  }
}
