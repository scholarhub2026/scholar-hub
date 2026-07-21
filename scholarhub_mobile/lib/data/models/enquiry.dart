// Class-enquiry client model (the lead front-door that replaces booking).

num _num(dynamic v) {
  if (v is num) return v;
  if (v is String) return num.tryParse(v) ?? 0;
  return 0;
}

DateTime? _date(dynamic v) => v is String ? DateTime.tryParse(v) : null;
String _str(dynamic v) => (v ?? '').toString();

enum EnquiryType { demo, subjectWise }

extension EnquiryTypeX on EnquiryType {
  String get apiValue =>
      this == EnquiryType.demo ? 'demo' : 'subject-wise';
  String get label => this == EnquiryType.demo ? 'Demo class' : 'Subject-wise';
}

class EnquirySubject {
  final String? subjectId;
  final String name;
  final num price;

  const EnquirySubject({
    required this.subjectId,
    required this.name,
    required this.price,
  });

  Map<String, dynamic> toJson() => {
        'subjectId': ?subjectId,
        'name': name,
        'price': price,
      };

  factory EnquirySubject.fromJson(Map<String, dynamic> json) => EnquirySubject(
        subjectId: json['subjectId'] == null ? null : _str(json['subjectId']),
        name: _str(json['name']),
        price: _num(json['price']),
      );
}

/// An enquiry as returned by the admin list.
class EnquiryRecord {
  final String id;
  final String studentName;
  final String email;
  final String phone;
  final String mentorId;
  final String mentorName;
  final String selectedSyllabus;
  final String? classId;
  final String className;
  final EnquiryType enquiryType;
  final List<EnquirySubject> subjects;
  final num estimatedAmount;
  final String message;
  final String status; // new | contacted | converted | closed
  final DateTime? createdAt;

  const EnquiryRecord({
    required this.id,
    required this.studentName,
    required this.email,
    required this.phone,
    required this.mentorId,
    required this.mentorName,
    required this.selectedSyllabus,
    required this.classId,
    required this.className,
    required this.enquiryType,
    required this.subjects,
    required this.estimatedAmount,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  bool get isDemo => enquiryType == EnquiryType.demo;
  bool get isConverted => status == 'converted';

  factory EnquiryRecord.fromJson(Map<String, dynamic> json) {
    final rawSubjects = json['subjects'];
    final subjects = <EnquirySubject>[];
    if (rawSubjects is List) {
      for (final s in rawSubjects) {
        if (s is Map) {
          subjects.add(EnquirySubject.fromJson(s.cast<String, dynamic>()));
        }
      }
    }
    return EnquiryRecord(
      id: _str(json['_id']),
      studentName: _str(json['studentName']),
      email: _str(json['email']),
      phone: _str(json['phone']),
      mentorId: _str(json['mentorId']),
      mentorName: _str(json['mentorName']),
      selectedSyllabus: _str(json['selectedSyllabus']),
      classId: json['classId'] == null ? null : _str(json['classId']),
      className: _str(json['className']),
      enquiryType: _str(json['enquiryType']) == 'demo'
          ? EnquiryType.demo
          : EnquiryType.subjectWise,
      subjects: subjects,
      estimatedAmount: _num(json['estimatedAmount']),
      message: _str(json['message']),
      status: _str(json['status']).isEmpty ? 'new' : _str(json['status']),
      createdAt: _date(json['createdAt']),
    );
  }
}
