import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/ad_banner.dart';
import 'ads_cubit.dart';

/// Home promotional carousel — admin-managed banners from `/ads`. Renders
/// nothing until at least one banner loads, so it never leaves an empty gap.
class AdsCarousel extends StatelessWidget {
  const AdsCarousel({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AdsCubit()..load(),
      child: const _AdsCarouselView(),
    );
  }
}

/// Owns the [PageController] + auto-scroll [Timer] (lifecycle only — all data
/// state lives in [AdsCubit], no setState).
class _AdsCarouselView extends StatefulWidget {
  const _AdsCarouselView();

  @override
  State<_AdsCarouselView> createState() => _AdsCarouselViewState();
}

class _AdsCarouselViewState extends State<_AdsCarouselView> {
  final PageController _controller = PageController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _tick());
  }

  void _tick() {
    if (!mounted || !_controller.hasClients) return;
    final ads = context.read<AdsCubit>().state.ads;
    if (ads.length < 2) return;
    final current = _controller.page?.round() ?? 0;
    _controller.animateToPage(
      (current + 1) % ads.length,
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _open(AdBanner ad) async {
    if (!ad.hasLink) return;
    final uri = Uri.tryParse(ad.linkUrl);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AdsCubit, AdsState>(
      builder: (context, state) {
        final ads = state.ads;
        if (ads.isEmpty) return const SizedBox.shrink();

        return Column(
          children: [
            SizedBox(
              height: 150.h,
              child: PageView.builder(
                controller: _controller,
                itemCount: ads.length,
                itemBuilder: (context, index) => _banner(ads[index]),
              ),
            ),
            if (ads.length > 1) ...[
              SizedBox(height: 12.h),
              SmoothPageIndicator(
                controller: _controller,
                count: ads.length,
                effect: ExpandingDotsEffect(
                  dotHeight: 6.h,
                  dotWidth: 6.w,
                  expansionFactor: 3,
                  activeDotColor: AppColors.primary,
                  dotColor: AppColors.border,
                ),
              ),
            ],
          ],
        ).animate().fadeIn(duration: 400.ms);
      },
    );
  }

  Widget _banner(AdBanner ad) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20.w),
      child: GestureDetector(
        onTap: () => _open(ad),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20.r),
          child: CachedNetworkImage(
            imageUrl: ad.imageUrl,
            fit: BoxFit.cover,
            width: double.infinity,
            placeholder: (_, _) => Container(color: AppColors.surface),
            errorWidget: (_, _, _) => Container(
              color: AppColors.surface,
              alignment: Alignment.center,
              child: Icon(
                Icons.image_not_supported_outlined,
                color: AppColors.textMuted,
                size: 28.sp,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
