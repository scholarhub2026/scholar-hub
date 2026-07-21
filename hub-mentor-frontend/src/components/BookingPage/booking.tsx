import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, GraduationCap, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Label = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 font-display text-base font-bold text-slate-900">{children}</h3>
);

/**
 * Enquiry step 1 — pick a class and enquiry type (Demo / Subject-wise). No
 * slots, no payment: this is a lead, not a booking.
 */
const Booking = ({ mentor, setFormData, formData }) => {
  if (!mentor) return <p>No mentor data available</p>;

  const syllabusList = [
    ...new Set(
      mentor.selected_class.map((item) => item.class_id.syllabus).filter(Boolean),
    ),
  ];

  const filteredClasses = formData.selectedSyllabus
    ? mentor.selected_class.filter(
        (item) => item.class_id.syllabus === formData.selectedSyllabus,
      )
    : [];

  const toggleSubject = (sub) => {
    const entry = {
      subjectId: sub.subject_id._id,
      name: sub.subject_id.name,
      price: sub.subject_price ?? 0,
    };
    setFormData((prev) => {
      const exists = prev.selectedSubjects.some(
        (s) => s.subjectId === entry.subjectId,
      );
      return {
        ...prev,
        selectedSubjects: exists
          ? prev.selectedSubjects.filter((s) => s.subjectId !== entry.subjectId)
          : [...prev.selectedSubjects, entry],
      };
    });
  };

  const isSubjectWise = formData.enquiryType === "subject-wise";
  const subjectTotal = formData.selectedSubjects.reduce(
    (acc, s) => acc + (s.price ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Enquire about classes
        </h2>
        <p className="mt-1 text-slate-500">
          with {mentor.firstName} {mentor.lastName}
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* 1. Syllabus */}
        <div>
          <Label>Select Syllabus</Label>
          <Select
            value={formData.selectedSyllabus || undefined}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                selectedSyllabus: value,
                selectedClass: null,
                enquiryType: "",
                selectedSubjects: [],
              }))
            }
          >
            <SelectTrigger className="h-11 uppercase">
              <SelectValue placeholder="Choose syllabus" />
            </SelectTrigger>
            <SelectContent>
              {syllabusList.map((syllabus: string, idx: number) => (
                <SelectItem key={idx} value={syllabus} className="uppercase">
                  {syllabus}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Class */}
        {formData.selectedSyllabus && (
          <div>
            <Label>Select Class</Label>
            <div className="space-y-2">
              {filteredClasses.map((cls, index) => {
                const selected =
                  formData.selectedClass?.class_id._id === cls.class_id._id;
                return (
                  <button
                    type="button"
                    key={index}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        selectedClass: cls,
                        enquiryType: "",
                        selectedSubjects: [],
                      }))
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div>
                      <div className="font-semibold capitalize text-slate-900">
                        {cls.class_id.class}
                      </div>
                      <div className="text-sm uppercase text-slate-500">
                        {cls.class_id.syllabus}
                      </div>
                    </div>
                    {selected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Enquiry type: Demo / Subject-wise */}
        {formData.selectedClass && (
          <div>
            <Label>What would you like?</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: "demo",
                  icon: GraduationCap,
                  title: "Demo class",
                  sub: "A free trial class",
                },
                {
                  key: "subject-wise",
                  icon: BookOpen,
                  title: "Subject-wise",
                  sub: "Pick the subjects you need",
                },
              ].map(({ key, icon: Icon, title, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      enquiryType: key,
                      selectedSubjects: key === "demo" ? [] : prev.selectedSubjects,
                    }))
                  }
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition",
                    formData.enquiryType === key
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-slate-800">{title}</span>
                  <span className="text-xs text-slate-500">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Subjects (subject-wise only) */}
        {isSubjectWise && formData.selectedClass && (
          <div>
            <Label>Select Subject(s)</Label>
            <div className="space-y-2">
              {formData.selectedClass.subject.map((sub) => {
                const checked = formData.selectedSubjects.some(
                  (s) => s.subjectId === sub.subject_id._id,
                );
                return (
                  <label
                    key={sub.subject_id._id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition",
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={checked}
                        onChange={() => toggleSubject(sub)}
                      />
                      <span className="font-medium capitalize text-slate-800">
                        {sub.subject_id.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      ₹{sub.subject_price}
                    </span>
                  </label>
                );
              })}
            </div>
            {formData.selectedSubjects.length === 0 && (
              <p className="mt-2 text-sm text-red-500">
                Please select at least one subject.
              </p>
            )}
          </div>
        )}

        {/* 5. Indicative amount */}
        {formData.enquiryType && (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4">
            <span className="font-medium text-slate-700">Indicative fee</span>
            <span className="font-display text-xl font-bold text-slate-900">
              {formData.enquiryType === "demo"
                ? "Free"
                : subjectTotal > 0
                  ? `₹${subjectTotal}`
                  : "—"}
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        No payment now — we'll contact you to arrange classes.
      </p>
    </div>
  );
};

export default Booking;
