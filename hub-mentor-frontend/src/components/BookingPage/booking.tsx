import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookingQuoteQuery } from "@/api/booking/quote-api";

const Label = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-2 font-display text-base font-bold text-slate-900">{children}</h3>
);

const Booking = ({ mentor, setFormData, formData }) => {
  // Server-side pricing preview — the client never computes money.
  const quoteQuery = useBookingQuoteQuery({
    mentorId: mentor?._id,
    classId: formData.selectedClass?.class_id?._id,
    bookingType: formData.bookingType,
    selectedSubjects: formData.selectedSubjects,
  });
  const quote = quoteQuery.data;
  const quoteError = (
    quoteQuery.error as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message;

  // Keep formData.totalAmount in sync for backward compat — this is the
  // server's estimate, never shown as a payable total.
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalAmount: quote?.estimatedAmount ?? 0,
    }));
  }, [quote?.estimatedAmount, setFormData]);

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

  const toggleSubject = (subject) => {
    if (formData.bookingType === "individual") {
      setFormData((prev) => ({ ...prev, selectedSubjects: [subject._id] }));
    } else {
      if (formData.selectedSubjects.includes(subject._id)) {
        setFormData((prev) => ({
          ...prev,
          selectedSubjects: prev.selectedSubjects.filter((s) => s !== subject._id),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          selectedSubjects: [...prev.selectedSubjects, subject._id],
        }));
      }
    }
  };

  const isSubjectRequired =
    formData.bookingType === "individual" || formData.bookingType === "multiple";

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Book a session
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
                bookingType: "",
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
                        bookingType: "",
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
                      <div className="text-sm text-slate-500 uppercase">
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

        {/* 3. Booking Type */}
        {formData.selectedClass && (
          <div>
            <Label>Booking Type</Label>
            <Select
              value={formData.bookingType || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  bookingType: value,
                  selectedSubjects: [],
                }))
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Class</SelectItem>
                <SelectItem value="individual">Individual Subject</SelectItem>
                <SelectItem value="multiple">Multiple Subjects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 4. Subjects */}
        {formData.selectedClass &&
          (formData.bookingType === "individual" ||
            formData.bookingType === "multiple") && (
            <div>
              <Label>Select Subject(s)</Label>
              <div className="space-y-2">
                {formData.selectedClass.subject.map((sub) => {
                  const checked = formData.selectedSubjects.includes(
                    sub.subject_id._id,
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
                          type={
                            formData.bookingType === "individual"
                              ? "radio"
                              : "checkbox"
                          }
                          name="subject"
                          className="h-4 w-4 accent-primary"
                          checked={checked}
                          onChange={() => toggleSubject(sub.subject_id)}
                        />
                        <span className="font-medium capitalize text-slate-800">
                          {sub.subject_id.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {isSubjectRequired && formData.selectedSubjects.length === 0 && (
                <p className="mt-2 text-sm text-red-500">
                  Please select at least one subject.
                </p>
              )}
            </div>
          )}

        {/* 5. Fee — server-computed rate card (no payment at booking) */}
        {formData.bookingType &&
          (formData.bookingType === "full" ||
            formData.selectedSubjects.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-2 font-medium text-slate-800">
                <BookOpen className="h-4 w-4" /> Your fee
              </div>

              {quoteQuery.isLoading && (
                <p className="text-sm text-slate-400">Calculating fee…</p>
              )}

              {quoteError && !quoteQuery.isLoading && (
                <p className="text-sm text-red-500">{quoteError}</p>
              )}

              {quote && !quoteQuery.isLoading && !quoteError && (
                <div className="space-y-2">
                  {quote.rateCard.perClassFee != null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Per class</span>
                      <span className="font-display text-lg font-bold text-slate-900">
                        ₹{quote.rateCard.perClassFee}
                      </span>
                    </div>
                  ) : (
                    quote.rateCard.subjectRates.map((r) => (
                      <div
                        key={r.subjectId ?? r.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize text-slate-600">
                          {r.name || "Subject"}
                        </span>
                        <span className="font-semibold text-slate-900">
                          ₹{r.hourlyRate}/hr
                        </span>
                      </div>
                    ))
                  )}
                  <p className="pt-1 text-xs text-slate-400">
                    {quote.billingNote}
                  </p>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default Booking;
