/// Helper to coerce dynamic numbers/strings into `num`.
num _toNum(dynamic value) {
  if (value is num) return value;
  if (value is String) return num.tryParse(value) ?? 0;
  return 0;
}

/// A subject offered within a selected class.
class MentorSubject {
  final String id;
  final String name;
  final num price;

  const MentorSubject({
    required this.id,
    required this.name,
    required this.price,
  });

  factory MentorSubject.fromJson(Map<String, dynamic> json) {
    final ref = json['subject_id'];
    String id = '';
    String name = '';
    if (ref is Map) {
      id = (ref['_id'] ?? '').toString();
      name = (ref['name'] ?? '').toString();
    } else if (ref != null) {
      id = ref.toString();
    }
    return MentorSubject(
      id: id,
      name: name,
      price: _toNum(json['subject_price']),
    );
  }
}

/// A class/grade a mentor teaches, with its syllabus, base price and subjects.
class MentorClass {
  final String id;
  final String className;
  final String syllabus;
  final num price;
  final List<MentorSubject> subjects;

  const MentorClass({
    required this.id,
    required this.className,
    required this.syllabus,
    required this.price,
    required this.subjects,
  });

  String get label =>
      syllabus.isNotEmpty ? '$className · $syllabus' : className;

  factory MentorClass.fromJson(Map<String, dynamic> json) {
    final ref = json['class_id'];
    String id = '';
    String className = '';
    String syllabus = '';
    if (ref is Map) {
      id = (ref['_id'] ?? '').toString();
      className = (ref['class'] ?? '').toString();
      syllabus = (ref['syllabus'] ?? '').toString();
    } else if (ref != null) {
      id = ref.toString();
    }

    final rawSubjects = json['subject'];
    final subjects = <MentorSubject>[];
    if (rawSubjects is List) {
      for (final s in rawSubjects) {
        if (s is Map<String, dynamic>) {
          subjects.add(MentorSubject.fromJson(s));
        }
      }
    } else if (rawSubjects is Map<String, dynamic>) {
      subjects.add(MentorSubject.fromJson(rawSubjects));
    }

    return MentorClass(
      id: id,
      className: className,
      syllabus: syllabus,
      price: _toNum(json['price']),
      subjects: subjects,
    );
  }
}

/// A mentor/tutor profile.
class Mentor {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phoneNumber;
  final String experience;
  final String educationQualification;
  final String additionalDetails; // rich HTML bio
  final String rating;
  final String location;
  final String gender;
  final String? profilePic;
  final bool isAvailable;
  final bool isFirstLogin;
  final bool isActive;
  final bool adminApprove;
  final String message;
  final String paymentBankAccount;
  final String paymentIfsc;
  final String paymentBranch;
  final String paymentHolder;
  final String paymentUpi;
  final List<String> availableSlots;
  final List<MentorClass> classes;

  const Mentor({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phoneNumber,
    required this.experience,
    required this.educationQualification,
    required this.additionalDetails,
    required this.rating,
    required this.location,
    required this.gender,
    required this.profilePic,
    required this.isAvailable,
    required this.isFirstLogin,
    required this.isActive,
    required this.adminApprove,
    required this.message,
    required this.paymentBankAccount,
    required this.paymentIfsc,
    required this.paymentBranch,
    required this.paymentHolder,
    required this.paymentUpi,
    required this.availableSlots,
    required this.classes,
  });

  String get fullName => '$firstName $lastName'.trim();

  String get headline =>
      experience.isNotEmpty ? experience : 'Verified Scholar Hub mentor';

  double get ratingValue => double.tryParse(rating) ?? 4.8;

  /// Unique syllabi across all classes.
  List<String> get syllabi {
    final set = <String>{};
    for (final c in classes) {
      if (c.syllabus.isNotEmpty) set.add(c.syllabus);
    }
    return set.toList();
  }

  /// Unique class labels (e.g. "Class 10 · CBSE").
  List<String> get classLabels {
    final set = <String>{};
    for (final c in classes) {
      if (c.className.isNotEmpty) set.add(c.label);
    }
    return set.toList();
  }

  /// Unique class names (e.g. "Class 10"), optionally scoped to a syllabus.
  List<String> classNames({String? syllabus}) {
    final set = <String>{};
    for (final c in classes) {
      if (c.className.isEmpty) continue;
      if (syllabus != null && c.syllabus != syllabus) continue;
      set.add(c.className);
    }
    return set.toList();
  }

  /// Unique subject names across all classes.
  List<String> get subjectNames {
    final set = <String>{};
    for (final c in classes) {
      for (final s in c.subjects) {
        if (s.name.isNotEmpty) set.add(s.name);
      }
    }
    return set.toList();
  }

  /// Lowest class price — used for "from ₹x" labels.
  num? get startingPrice {
    final prices = classes.map((c) => c.price).where((p) => p > 0).toList();
    if (prices.isEmpty) return null;
    prices.sort();
    return prices.first;
  }

  List<MentorClass> classesForSyllabus(String syllabus) =>
      classes.where((c) => c.syllabus == syllabus).toList();

  factory Mentor.fromJson(Map<String, dynamic> json) {
    final slots = <String>[];
    final rawSlots = json['available_slot'];
    if (rawSlots is List) {
      for (final s in rawSlots) {
        if (s is Map && s['time'] != null) {
          slots.add(s['time'].toString());
        } else if (s != null) {
          slots.add(s.toString());
        }
      }
    }

    final classes = <MentorClass>[];
    final rawClasses = json['selected_class'];
    if (rawClasses is List) {
      for (final c in rawClasses) {
        if (c is Map<String, dynamic>) {
          classes.add(MentorClass.fromJson(c));
        }
      }
    }

    final pd = json['payment_details'];
    String pdField(String key) =>
        (pd is Map ? (pd[key] ?? '') : '').toString();

    return Mentor(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phoneNumber: (json['phoneNumber'] ?? '').toString(),
      experience: (json['experience'] ?? '').toString(),
      educationQualification:
          (json['education_qualification'] ?? '').toString(),
      additionalDetails: (json['additional_details'] ?? '').toString(),
      rating: (json['rating'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      gender: (json['gender'] ?? '').toString(),
      profilePic: json['profile_pic']?.toString(),
      isAvailable: json['is_available'] != false,
      isFirstLogin: json['is_first_login'] == true,
      isActive: json['isActive'] != false,
      adminApprove: json['admin_approve'] == true,
      message: (json['message'] ?? '').toString(),
      paymentBankAccount: pdField('back_account'),
      paymentIfsc: pdField('ifsc_code'),
      paymentBranch: pdField('branch'),
      paymentHolder: pdField('account_holder_name'),
      paymentUpi: pdField('upi_id'),
      availableSlots: slots,
      classes: classes,
    );
  }
}

/// A page of mentors from the admin `/mentor?page=&limit=&type=` listing.
class PaginatedMentors {
  final List<Mentor> items;
  final int totalPages;
  final int currentPage;
  final int total;

  const PaginatedMentors({
    required this.items,
    required this.totalPages,
    required this.currentPage,
    required this.total,
  });
}
