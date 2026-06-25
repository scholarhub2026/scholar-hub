import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/catalog.dart';
import '../../../widgets/app_snackbar.dart';
import '../../../widgets/app_text_field.dart';
import '../../../widgets/primary_button.dart';
import 'admin_classes_cubit.dart';

class _SubjectRow {
  String? subjectId;
  final TextEditingController price;
  _SubjectRow({this.subjectId, String price = ''})
      : price = TextEditingController(text: price);
}

/// Create / edit a class with its subjects and per-subject prices.
class ClassFormScreen extends StatefulWidget {
  final ClassItem? existing;
  final List<SubjectCatalogItem> subjects;

  const ClassFormScreen({super.key, this.existing, required this.subjects});

  @override
  State<ClassFormScreen> createState() => _ClassFormScreenState();
}

class _ClassFormScreenState extends State<ClassFormScreen> {
  late final TextEditingController _name;
  late final TextEditingController _syllabus;
  late final TextEditingController _basePrice;
  late final TextEditingController _sortOrder;
  late bool _isActive;
  late List<_SubjectRow> _rows;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?.className ?? '');
    _syllabus = TextEditingController(text: e?.syllabus ?? '');
    _basePrice = TextEditingController(text: e?.basePrice ?? '');
    _sortOrder =
        TextEditingController(text: e == null ? '' : e.sortOrder.toStringAsFixed(0));
    _isActive = e?.isActive ?? true;
    _rows = (e == null || e.subjects.isEmpty)
        ? [_SubjectRow()]
        : e.subjects
            .map((s) => _SubjectRow(
                  subjectId: s.subjectId,
                  price: s.price.toStringAsFixed(0),
                ))
            .toList();
  }

  @override
  void dispose() {
    _name.dispose();
    _syllabus.dispose();
    _basePrice.dispose();
    _sortOrder.dispose();
    for (final r in _rows) {
      r.price.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (_name.text.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter a class name.');
      return;
    }
    if (_syllabus.text.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter a syllabus.');
      return;
    }
    if (_basePrice.text.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter a base price.');
      return;
    }
    final subjects = <Map<String, dynamic>>[];
    for (final r in _rows) {
      if (r.subjectId != null && r.subjectId!.isNotEmpty) {
        subjects.add({
          'subjectId': r.subjectId,
          'price': num.tryParse(r.price.text.trim()) ?? 0,
        });
      }
    }
    if (subjects.isEmpty) {
      AppSnackbar.error(context, 'Add at least one subject.');
      return;
    }

    final payload = {
      'class': _name.text.trim(),
      'syllabus': _syllabus.text.trim(),
      'basePrice': _basePrice.text.trim(),
      'sortOrder': int.tryParse(_sortOrder.text.trim()) ?? 0,
      'isActive': _isActive,
      'subjects': subjects,
    };

    setState(() => _saving = true);
    try {
      final cubit = context.read<AdminClassesCubit>();
      if (_isEdit) {
        await cubit.update(widget.existing!.id, payload);
      } else {
        await cubit.create(payload);
      }
      if (!mounted) return;
      Navigator.pop(context);
      AppSnackbar.success(context, _isEdit ? 'Class updated.' : 'Class created.');
    } on ApiException catch (e) {
      if (mounted) AppSnackbar.error(context, e.message);
    } catch (_) {
      if (mounted) AppSnackbar.error(context, 'Unable to save the class.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(_isEdit ? 'Edit class' : 'New class')),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 32.h),
        children: [
          AppTextField(
            label: 'Class name',
            controller: _name,
            hint: 'e.g. Class 10',
          ),
          SizedBox(height: 16.h),
          AppTextField(
            label: 'Syllabus',
            controller: _syllabus,
            hint: 'e.g. CBSE',
          ),
          SizedBox(height: 16.h),
          Row(
            children: [
              Expanded(
                child: AppTextField(
                  label: 'Base price (₹)',
                  controller: _basePrice,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: AppTextField(
                  label: 'Sort order',
                  controller: _sortOrder,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeTrackColor: AppColors.primary,
            title: const Text(
              'Active',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: const Text('Visible to students when booking'),
            value: _isActive,
            onChanged: (v) => setState(() => _isActive = v),
          ),
          const Divider(height: 24),
          Row(
            children: [
              Text(
                'Subjects',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16.sp),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => setState(() => _rows.add(_SubjectRow())),
                icon: Icon(LucideIcons.plus, size: 18.sp),
                label: const Text('Add'),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          if (widget.subjects.isEmpty)
            Container(
              padding: EdgeInsets.all(14.r),
              decoration: BoxDecoration(
                color: AppColors.dangerSoft,
                borderRadius: BorderRadius.circular(14.r),
              ),
              child: Text(
                'No subjects in the catalog yet. Add subjects first, then '
                'attach them to a class.',
                style: TextStyle(color: AppColors.danger, fontSize: 13.sp),
              ),
            )
          else
            ...List.generate(_rows.length, (i) => _subjectRow(i)),
          SizedBox(height: 24.h),
          PrimaryButton(
            label: _isEdit ? 'Update class' : 'Create class',
            icon: LucideIcons.save,
            loading: _saving,
            onPressed: _saving ? null : _save,
          ),
        ],
      ),
    );
  }

  Widget _subjectRow(int index) {
    final row = _rows[index];
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 14.w),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(14.r),
                border: Border.all(color: AppColors.border),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: row.subjectId,
                  isExpanded: true,
                  hint: const Text('Subject'),
                  borderRadius: BorderRadius.circular(14.r),
                  items: widget.subjects
                      .map((s) => DropdownMenuItem(
                            value: s.id,
                            child: Text(
                              s.name,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => row.subjectId = v),
                ),
              ),
            ),
          ),
          SizedBox(width: 10.w),
          Expanded(
            flex: 2,
            child: TextField(
              controller: row.price,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(hintText: 'Price ₹'),
            ),
          ),
          IconButton(
            icon: Icon(LucideIcons.trash2, size: 18.sp),
            color: AppColors.danger,
            onPressed: _rows.length == 1
                ? null
                : () => setState(() {
                      _rows[index].price.dispose();
                      _rows.removeAt(index);
                    }),
          ),
        ],
      ),
    );
  }
}
