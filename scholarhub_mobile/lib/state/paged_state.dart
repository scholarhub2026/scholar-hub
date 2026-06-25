import 'package:equatable/equatable.dart';

import 'view_status.dart';

/// Generic state for a paginated, append-as-you-scroll list.
class PagedState<T> extends Equatable {
  final ViewStatus status;
  final List<T> items;
  final int page;
  final int totalPages;
  final bool loadingMore;
  final String? error;

  const PagedState({
    this.status = ViewStatus.initial,
    this.items = const [],
    this.page = 1,
    this.totalPages = 1,
    this.loadingMore = false,
    this.error,
  });

  bool get hasMore => page < totalPages;

  PagedState<T> copyWith({
    ViewStatus? status,
    List<T>? items,
    int? page,
    int? totalPages,
    bool? loadingMore,
    String? error,
  }) {
    return PagedState<T>(
      status: status ?? this.status,
      items: items ?? this.items,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      loadingMore: loadingMore ?? this.loadingMore,
      error: error,
    );
  }

  @override
  List<Object?> get props =>
      [status, items, page, totalPages, loadingMore, error];
}
