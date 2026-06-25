import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/catalog.dart';
import '../../../data/services/catalog_service.dart';
import '../../../state/view_status.dart';

class AdminSubjectsState extends Equatable {
  final ViewStatus status;
  final List<SubjectCatalogItem> items;
  final String? error;

  const AdminSubjectsState({
    this.status = ViewStatus.initial,
    this.items = const [],
    this.error,
  });

  AdminSubjectsState copyWith({
    ViewStatus? status,
    List<SubjectCatalogItem>? items,
    String? error,
  }) {
    return AdminSubjectsState(
      status: status ?? this.status,
      items: items ?? this.items,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, items, error];
}

class AdminSubjectsCubit extends Cubit<AdminSubjectsState> {
  final CatalogService _service;

  AdminSubjectsCubit({CatalogService? service})
      : _service = service ?? CatalogService(),
        super(const AdminSubjectsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final items = await _service.getSubjects();
      emit(state.copyWith(status: ViewStatus.success, items: items));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> create(String name) async {
    await _service.createSubject(name);
    await load();
  }

  Future<void> update(String id, String name, bool isActive) async {
    await _service.updateSubject(id, name: name, isActive: isActive);
    await load();
  }
}
