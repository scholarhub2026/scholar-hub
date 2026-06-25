import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/catalog.dart';
import '../../../data/services/catalog_service.dart';
import '../../../state/view_status.dart';

class AdminClassesState extends Equatable {
  final ViewStatus status;
  final List<ClassItem> classes;
  final List<SubjectCatalogItem> subjects;
  final String? error;

  const AdminClassesState({
    this.status = ViewStatus.initial,
    this.classes = const [],
    this.subjects = const [],
    this.error,
  });

  AdminClassesState copyWith({
    ViewStatus? status,
    List<ClassItem>? classes,
    List<SubjectCatalogItem>? subjects,
    String? error,
  }) {
    return AdminClassesState(
      status: status ?? this.status,
      classes: classes ?? this.classes,
      subjects: subjects ?? this.subjects,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, classes, subjects, error];
}

class AdminClassesCubit extends Cubit<AdminClassesState> {
  final CatalogService _service;

  AdminClassesCubit({CatalogService? service})
      : _service = service ?? CatalogService(),
        super(const AdminClassesState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final results = await Future.wait([
        _service.getClasses(),
        _service.getSubjects(),
      ]);
      emit(state.copyWith(
        status: ViewStatus.success,
        classes: results[0] as List<ClassItem>,
        subjects: results[1] as List<SubjectCatalogItem>,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  Future<void> create(Map<String, dynamic> payload) async {
    await _service.createClass(payload);
    await load();
  }

  Future<void> update(String id, Map<String, dynamic> payload) async {
    await _service.updateClass(id, payload);
    await load();
  }

  Future<void> delete(String id) async {
    await _service.deleteClass(id);
    await load();
  }
}
