num _num(dynamic v) {
  if (v is num) return v;
  if (v is String) return num.tryParse(v) ?? 0;
  return 0;
}

/// A subject + price entry within a class (admin catalog).
class ClassSubject {
  final String subjectId;
  final String name;
  final num price;

  const ClassSubject({
    required this.subjectId,
    required this.name,
    required this.price,
  });

  factory ClassSubject.fromJson(Map<String, dynamic> json) {
    final ref = json['subjectId'];
    String id = '';
    String name = '';
    if (ref is Map) {
      id = (ref['_id'] ?? '').toString();
      name = (ref['name'] ?? '').toString();
    } else if (ref != null) {
      id = ref.toString();
    }
    return ClassSubject(subjectId: id, name: name, price: _num(json['price']));
  }

  Map<String, dynamic> toPayload() => {'subjectId': subjectId, 'price': price};
}

/// A class/grade from `/classes` (admin catalog).
class ClassItem {
  final String id;
  final String className;
  final String syllabus;
  final String basePrice;
  final num sortOrder;
  final bool isActive;
  final List<ClassSubject> subjects;

  const ClassItem({
    required this.id,
    required this.className,
    required this.syllabus,
    required this.basePrice,
    this.sortOrder = 0,
    this.isActive = true,
    this.subjects = const [],
  });

  factory ClassItem.fromJson(Map<String, dynamic> json) {
    final subjects = <ClassSubject>[];
    final raw = json['subjects'];
    if (raw is List) {
      for (final s in raw) {
        if (s is Map) {
          subjects.add(ClassSubject.fromJson(s.cast<String, dynamic>()));
        }
      }
    }
    return ClassItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      className: (json['class'] ?? '').toString(),
      syllabus: (json['syllabus'] ?? '').toString(),
      basePrice: (json['basePrice'] ?? '').toString(),
      sortOrder: _num(json['sortOrder']),
      isActive: json['isActive'] != false,
      subjects: subjects,
    );
  }
}

/// A subject from `/subject/:type`.
class SubjectCatalogItem {
  final String id;
  final String name;
  final String type;
  final bool isActive;

  const SubjectCatalogItem({
    required this.id,
    required this.name,
    required this.type,
    this.isActive = true,
  });

  factory SubjectCatalogItem.fromJson(Map<String, dynamic> json) {
    return SubjectCatalogItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
      isActive: json['isActive'] != false,
    );
  }
}
