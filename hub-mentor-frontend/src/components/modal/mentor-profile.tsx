import { useSnapshot } from "valtio";
import { store } from "@/contexts/store";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import StatusBadge from "@/components/shared/StatusBadge";
import { BookOpen, FileText, GraduationCap, MapPin, Star } from "lucide-react";

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className="text-sm font-medium text-slate-800">{value || "—"}</div>
  </div>
);

const MentorProfile = () => {
  const { modalData } = useSnapshot(store);
  // Fetch the full, populated mentor (class + syllabus + subject names) — the
  // list row only has partial data.
  const { data } = useGetMentorQuery({ id: modalData?._id });
  const mentor: any = data?.data || modalData || {};

  const name = `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor";
  const classes = Array.isArray(mentor.selected_class) ? mentor.selected_class : [];
  const pay = mentor.payment_details || {};

  return (
    <div className="max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-xl font-bold text-white">
          {mentor.profile_pic ? (
            <img src={mentor.profile_pic} alt={name} className="h-full w-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-xl font-bold text-slate-900">{name}</h4>
          <p className="truncate text-sm text-slate-500">{mentor.email || "—"}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <StatusBadge status={mentor.admin_approve ? "approved" : "pending"} />
            <StatusBadge status={mentor.is_available === false ? "inactive" : "active"} />
            {mentor.rating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {mentor.rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Basic details */}
      <div className="grid grid-cols-2 gap-4 py-5">
        <Field label="Phone" value={mentor.phoneNumber} />
        <Field label="Gender" value={mentor.gender} />
        <Field label="Experience" value={mentor.experience} />
        <Field
          label="Qualification"
          value={
            mentor.education_qualification ? (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                {mentor.education_qualification}
              </span>
            ) : undefined
          }
        />
        <Field
          label="Location"
          value={
            mentor.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                {mentor.location}
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Classes & subjects taught */}
      <div className="border-t border-slate-100 py-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen className="h-4 w-4 text-primary" />
          Classes &amp; Subjects taught
        </div>
        {classes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
            This mentor hasn't selected any classes/subjects yet.
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls: any, i: number) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize text-slate-800">
                    {cls.class_id?.class ?? "Class"}
                    {cls.class_id?.syllabus ? ` · ${cls.class_id.syllabus}` : ""}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">₹{cls.price}</span>
                </div>
                {Array.isArray(cls.subject) && cls.subject.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cls.subject.map((sub: any, j: number) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        <span className="capitalize">{sub.subject_id?.name ?? "Subject"}</span>
                        <span className="text-primary/60">₹{sub.subject_price}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      {mentor.additional_details && (
        <div className="border-t border-slate-100 py-5">
          <div className="mb-2 text-sm font-semibold text-slate-700">About</div>
          <div
            className="prose prose-sm max-w-none text-slate-600"
            dangerouslySetInnerHTML={{ __html: mentor.additional_details }}
          />
        </div>
      )}

      {/* ID proof + payment */}
      <div className="grid grid-cols-1 gap-5 border-t border-slate-100 py-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700">ID Proof</div>
          {mentor.id_proof ? (
            <a
              href={mentor.id_proof}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              View document
            </a>
          ) : (
            <span className="text-sm text-slate-400">Not uploaded</span>
          )}
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700">Payment</div>
          <div className="space-y-0.5 text-sm text-slate-600">
            <div>A/C: {pay.back_account || "—"}</div>
            <div>IFSC: {pay.ifsc_code || "—"}</div>
            <div>UPI: {pay.upi_id || "—"}</div>
          </div>
        </div>
      </div>

      {mentor.message && (
        <div className="border-t border-slate-100 pt-5">
          <div className="mb-1 text-sm font-semibold text-slate-700">Message</div>
          <p className="whitespace-pre-line text-sm text-slate-600">{mentor.message}</p>
        </div>
      )}
    </div>
  );
};

export default MentorProfile;
