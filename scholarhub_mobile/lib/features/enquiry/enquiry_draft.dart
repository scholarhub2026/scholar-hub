import '../../data/models/enquiry.dart';
import '../../data/models/mentor.dart';

/// Mutable wizard state collected across the enquiry flow before it is sent to
/// `POST /enquiry`. Unlike a booking there are no slots and no payment — an
/// enquiry is just a lead the admin follows up on offline.
class EnquiryDraft {
  final Mentor mentor;

  String? syllabus;
  MentorClass? selectedClass;
  EnquiryType? enquiryType;
  final Set<String> selectedSubjectIds = {};

  // Contact details.
  String studentName = '';
  String email = '';
  String phone = '';
  String message = '';

  EnquiryDraft(this.mentor);

  List<MentorClass> get availableClasses =>
      syllabus == null ? const [] : mentor.classesForSyllabus(syllabus!);

  List<MentorSubject> get classSubjects => selectedClass?.subjects ?? const [];

  List<MentorSubject> get chosenSubjects =>
      classSubjects.where((s) => selectedSubjectIds.contains(s.id)).toList();

  bool get isDemo => enquiryType == EnquiryType.demo;

  /// Subject-wise enquiries need at least one subject picked.
  bool get requiresSubjects => enquiryType == EnquiryType.subjectWise;

  /// Free for a demo, otherwise the sum of the chosen subject prices.
  num get estimatedAmount =>
      isDemo ? 0 : chosenSubjects.fold<num>(0, (sum, s) => sum + s.price);

  bool get isStepOneValid {
    if (syllabus == null || selectedClass == null || enquiryType == null) {
      return false;
    }
    if (requiresSubjects && selectedSubjectIds.isEmpty) return false;
    return true;
  }

  bool get isDetailsValid =>
      studentName.trim().isNotEmpty &&
      email.trim().isNotEmpty &&
      phone.trim().isNotEmpty;

  /// Chosen subjects mapped onto the enquiry service payload shape.
  List<EnquirySubject> get subjectPayload => chosenSubjects
      .map((s) => EnquirySubject(subjectId: s.id, name: s.name, price: s.price))
      .toList();
}
