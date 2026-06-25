import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/models/catalog.dart';
import '../../../data/models/mentor.dart';
import '../../../data/services/catalog_service.dart';
import '../../../data/services/mentor_service.dart';
import '../../../state/view_status.dart';

class MentorProfileState extends Equatable {
  final ViewStatus status;
  final Mentor? mentor;
  final List<ClassItem> classes;
  final bool saving;
  final String? error;

  const MentorProfileState({
    this.status = ViewStatus.initial,
    this.mentor,
    this.classes = const [],
    this.saving = false,
    this.error,
  });

  MentorProfileState copyWith({
    ViewStatus? status,
    Mentor? mentor,
    List<ClassItem>? classes,
    bool? saving,
    String? error,
  }) {
    return MentorProfileState(
      status: status ?? this.status,
      mentor: mentor ?? this.mentor,
      classes: classes ?? this.classes,
      saving: saving ?? this.saving,
      error: error,
    );
  }

  @override
  List<Object?> get props => [status, mentor?.id, classes, saving, error];
}

class MentorProfileCubit extends Cubit<MentorProfileState> {
  final MentorService _mentors;
  final CatalogService _catalog;
  final String mentorId;

  MentorProfileCubit(
    this.mentorId, {
    MentorService? mentors,
    CatalogService? catalog,
  })  : _mentors = mentors ?? MentorService(),
        _catalog = catalog ?? CatalogService(),
        super(const MentorProfileState());

  Future<void> load() async {
    emit(state.copyWith(status: ViewStatus.loading));
    try {
      final results = await Future.wait([
        _mentors.getMentorById(mentorId),
        _catalog.getClasses(),
      ]);
      emit(state.copyWith(
        status: ViewStatus.success,
        mentor: results[0] as Mentor,
        classes: results[1] as List<ClassItem>,
      ));
    } catch (e) {
      emit(state.copyWith(status: ViewStatus.failure, error: e.toString()));
    }
  }

  /// Saves the completed profile. Returns true on success.
  Future<bool> save(Map<String, dynamic> payload) async {
    emit(state.copyWith(saving: true));
    try {
      await _mentors.updateMentor(mentorId, payload);
      emit(state.copyWith(saving: false));
      return true;
    } catch (e) {
      emit(state.copyWith(saving: false, error: e.toString()));
      rethrow;
    }
  }
}
