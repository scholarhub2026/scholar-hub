/// Helper to coerce dynamic numbers/strings into `num`.
num _toNum(dynamic value) {
  if (value is num) return value;
  if (value is String) return num.tryParse(value) ?? 0;
  return 0;
}

/// Helper to coerce dynamic values into `int`.
int _toInt(dynamic value, [int fallback = 0]) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

/// A recurring weekly availability window on a mentor's schedule, e.g.
/// Monday 18:00–19:00. `dayOfWeek` follows the JS/`getDay()` convention
/// (0 = Sunday … 6 = Saturday) to match the backend.
///
/// Base fields come from a mentor's `weekly_availability`. When loaded via
/// `GET /mentor/:id/availability` the slot is also annotated with
/// [recurringRemaining] and [dateHolds] so the client can show remaining seats.
class AvailabilitySlot {
  final String id;
  final int dayOfWeek;
  final String startTime; // "HH:mm" (24h)
  final String endTime;
  final int capacity; // 1 = 1-on-1, >1 = group
  final bool isActive;
  final int? recurringRemaining; // seats left for a recurring hold
  final Map<String, int> dateHolds; // "YYYY-MM-DD" -> single-session holds

  const AvailabilitySlot({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.capacity = 1,
    this.isActive = true,
    this.recurringRemaining,
    this.dateHolds = const {},
  });

  bool get isGroup => capacity > 1;

  static const _dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  String get dayShort =>
      (dayOfWeek >= 0 && dayOfWeek < 7) ? _dayShort[dayOfWeek] : '';

  String get rangeLabel => '$startTime–$endTime';

  /// e.g. "Mon 18:00–19:00".
  String get label => '$dayShort $rangeLabel';

  /// Seats left for a recurring booking (falls back to capacity when the
  /// enriched availability data hasn't been loaded).
  int get recurringLeft => recurringRemaining ?? capacity;

  /// Seats left on a specific calendar day: recurring seats minus that day's
  /// single-session holds. `dateKey` is "YYYY-MM-DD".
  int remainingOn(String dateKey) =>
      (recurringRemaining ?? capacity) - (dateHolds[dateKey] ?? 0);

  factory AvailabilitySlot.fromJson(Map<String, dynamic> json) {
    final holds = <String, int>{};
    final rawHolds = json['dateHolds'];
    if (rawHolds is Map) {
      rawHolds.forEach((k, v) => holds[k.toString()] = _toInt(v));
    }
    return AvailabilitySlot(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      dayOfWeek: _toInt(json['dayOfWeek']),
      startTime: (json['startTime'] ?? '').toString(),
      endTime: (json['endTime'] ?? '').toString(),
      capacity: _toInt(json['capacity'], 1),
      isActive: json['isActive'] != false,
      recurringRemaining:
          json['recurringRemaining'] == null ? null : _toInt(json['recurringRemaining']),
      dateHolds: holds,
    );
  }

  /// Payload shape for `PUT /mentor/:id/availability` (template edits).
  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) '_id': id,
        'dayOfWeek': dayOfWeek,
        'startTime': startTime,
        'endTime': endTime,
        'capacity': capacity,
        'isActive': isActive,
      };

  AvailabilitySlot copyWith({
    int? dayOfWeek,
    String? startTime,
    String? endTime,
    int? capacity,
    bool? isActive,
  }) =>
      AvailabilitySlot(
        id: id,
        dayOfWeek: dayOfWeek ?? this.dayOfWeek,
        startTime: startTime ?? this.startTime,
        endTime: endTime ?? this.endTime,
        capacity: capacity ?? this.capacity,
        isActive: isActive ?? this.isActive,
        recurringRemaining: recurringRemaining,
        dateHolds: dateHolds,
      );
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
  final List<AvailabilitySlot> weeklyAvailability;
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
    this.weeklyAvailability = const [],
    required this.classes,
  });

  /// Active availability slots, sorted by day (Mon-first) then start time.
  List<AvailabilitySlot> get activeSlots {
    final list = weeklyAvailability.where((s) => s.isActive).toList();
    int mondayFirst(int d) => d == 0 ? 7 : d; // Sun(0) -> 7 so Mon leads
    list.sort((a, b) {
      final byDay = mondayFirst(a.dayOfWeek).compareTo(mondayFirst(b.dayOfWeek));
      return byDay != 0 ? byDay : a.startTime.compareTo(b.startTime);
    });
    return list;
  }

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

    final weekly = <AvailabilitySlot>[];
    final rawWeekly = json['weekly_availability'];
    if (rawWeekly is List) {
      for (final w in rawWeekly) {
        if (w is Map) {
          weekly.add(AvailabilitySlot.fromJson(w.cast<String, dynamic>()));
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
      weeklyAvailability: weekly,
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
