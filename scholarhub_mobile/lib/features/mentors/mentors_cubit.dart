import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/di/service_locator.dart';
import '../../data/models/mentor.dart';
import '../../data/services/mentor_service.dart';
import '../../state/view_status.dart';

class MentorsState extends Equatable {
  final ViewStatus status;
  final List<Mentor> all;
  final String query; // lowercased
  final String? syllabus;
  final String? classFilter;
  final String? error;

  const MentorsState({
    this.status = ViewStatus.initial,
    this.all = const [],
    this.query = '',
    this.syllabus,
    this.classFilter,
    this.error,
  });

  MentorsState copyWith({
    ViewStatus? status,
    List<Mentor>? all,
    String? query,
    String? syllabus,
    String? classFilter,
    String? error,
    bool clearSyllabus = false,
    bool clearClass = false,
  }) {
    return MentorsState(
      status: status ?? this.status,
      all: all ?? this.all,
      query: query ?? this.query,
      syllabus: clearSyllabus ? null : (syllabus ?? this.syllabus),
      classFilter: clearClass ? null : (classFilter ?? this.classFilter),
      error: error,
    );
  }

  /// Unique syllabi (boards, e.g. CBSE/ICSE) across all mentors.
  List<String> get syllabi {
    final set = <String>{};
    for (final m in all) {
      set.addAll(m.syllabi);
    }
    return set.toList();
  }

  /// Class names available as filter chips, scoped to the selected syllabus.
  List<String> get classOptions {
    final set = <String>{};
    for (final m in all) {
      set.addAll(m.classNames(syllabus: syllabus));
    }
    final list = set.toList()..sort();
    return list;
  }

  /// Mentors matching the query (name/subject/headline/**location**) + filters.
  List<Mentor> get filtered {
    return all.where((m) {
      final matchesQuery = query.isEmpty ||
          m.fullName.toLowerCase().contains(query) ||
          m.subjectNames.any((s) => s.toLowerCase().contains(query)) ||
          m.headline.toLowerCase().contains(query) ||
          m.location.toLowerCase().contains(query);
      final matchesSyllabus = syllabus == null || m.syllabi.contains(syllabus);
      final matchesClass =
          classFilter == null || m.classNames().contains(classFilter);
      return matchesQuery && matchesSyllabus && matchesClass;
    }).toList();
  }

  @override
  List<Object?> get props => [status, all, query, syllabus, classFilter, error];
}

class MentorsCubit extends Cubit<MentorsState> {
  final MentorService _service;

  MentorsCubit({MentorService? service})
      : _service = service ?? sl<MentorService>(),
        super(const MentorsState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final mentors = await _service.getApprovedMentors();
      emit(state.copyWith(status: ViewStatus.success, all: mentors));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  void setQuery(String query) =>
      emit(state.copyWith(query: query.trim().toLowerCase()));

  /// Selecting a syllabus resets the class filter (classes are syllabus-scoped).
  void setSyllabus(String? syllabus) => emit(state.copyWith(
        syllabus: syllabus,
        clearSyllabus: syllabus == null,
        clearClass: true,
      ));

  void setClass(String? className) => emit(state.copyWith(
        classFilter: className,
        clearClass: className == null,
      ));

  /// A subject tapped on the home feed: apply as a fresh query, clear filters.
  void applyExternalQuery(String query) => emit(state.copyWith(
        query: query.trim().toLowerCase(),
        clearSyllabus: true,
        clearClass: true,
      ));
}
