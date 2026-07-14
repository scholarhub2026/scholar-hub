import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Loader2, FileText } from "lucide-react";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import { useAuth } from "@/auth/AuthProvider";
import { roleSlug } from "@/config/roles";

import RenderMentorDetails from "@/components/profile-page/RenderMentorDetails";
import RenderPaymentDetails from "@/components/profile-page/RengerPaymentDetails";

// Fields validated per section before saving that section.
const DETAILS_FIELDS = ["additional_details", "education_qualification", "location", "id_proof"];
const PAYMENT_FIELDS = [
  "payment_details.back_account",
  "payment_details.ifsc_code",
  "payment_details.branch",
  "payment_details.account_holder_name",
  "payment_details.upi_id",
];

type SectionKey = "details" | "payment";

const SectionCard = ({
  title,
  description,
  editable = true,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  children,
}: {
  title: string;
  description?: string;
  editable?: boolean;
  editing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  children: ReactNode;
}) => (
  <Card className="rounded-xl border-slate-200/80 shadow-sm">
    <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 py-4">
      <div>
        <CardTitle className="font-display text-base">{title}</CardTitle>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {editable && !editing && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit
        </Button>
      )}
    </CardHeader>
    <CardContent className="py-5">
      {children}
      {editing && (
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

const ReadonlyField = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className="text-sm font-medium capitalize text-slate-800">{value || "—"}</div>
  </div>
);

const ProfilePage = () => {
  const { user, refresh } = useAuth();
  const role = roleSlug(user?.role);
  const { id } = useParams<{ id: string }>();

  const methods = useForm();
  const { reset, trigger, getValues } = methods;

  const { data, isLoading } = useGetMentorQuery({ id });
  const mentor: any = data?.data || {};

  const { mutate, isPending } = useUpdateMentorMutation();
  const [editing, setEditing] = useState<SectionKey | null>(null);

  useEffect(() => {
    if (data?.data) reset({ ...data.data });
  }, [data, reset]);

  const cancel = () => {
    reset({ ...(data?.data || {}) });
    setEditing(null);
  };

  const saveSection = async (fields: string[]) => {
    const valid = await trigger(fields);
    if (!valid) return;
    mutate(
      {
        id,
        // Any save also marks the profile complete (clears the banner).
        data: { ...getValues(), is_first_login: false, completed_profile: true },
      },
      {
        onSuccess: async () => {
          await refresh();
          setEditing(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole={role}>
        <PageHeader title="My Profile" />
        <div className="max-w-3xl space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={role}>
      <PageHeader
        title="My Profile"
        description="View your details and edit each section as needed."
      />

      <FormProvider {...methods}>
        <div className="max-w-3xl space-y-6">
          {/* Account — read-only (contact admin to change) */}
          <SectionCard
            title="Account"
            description="Your identity details. Contact the admin to change these."
            editable={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <ReadonlyField
                label="Name"
                value={`${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim()}
              />
              <ReadonlyField label="Gender" value={mentor.gender} />
              <ReadonlyField label="Email" value={<span className="lowercase">{mentor.email}</span>} />
              <ReadonlyField label="Phone" value={mentor.phoneNumber} />
            </div>
          </SectionCard>

          {/* Details */}
          <SectionCard
            title="Mentor Details"
            description="Your bio, qualification, location and ID proof."
            editing={editing === "details"}
            onEdit={() => setEditing("details")}
            onCancel={cancel}
            onSave={() => saveSection(DETAILS_FIELDS)}
            saving={isPending}
          >
            {editing === "details" ? (
              <RenderMentorDetails />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ReadonlyField label="Qualification" value={mentor.education_qualification} />
                  <ReadonlyField label="Location" value={mentor.location} />
                </div>
                {mentor.additional_details && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">About</div>
                    <div
                      className="prose prose-sm mt-1 max-w-none text-slate-600"
                      dangerouslySetInnerHTML={{ __html: mentor.additional_details }}
                    />
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">ID Proof</div>
                  {mentor.id_proof ? (
                    <a
                      href={mentor.id_proof}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" /> View document
                    </a>
                  ) : (
                    <div className="text-sm text-slate-400">Not uploaded</div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Payment */}
          <SectionCard
            title="Payment & Photo"
            description="Bank details, UPI, and your profile picture."
            editing={editing === "payment"}
            onEdit={() => setEditing("payment")}
            onCancel={cancel}
            onSave={() => saveSection(PAYMENT_FIELDS)}
            saving={isPending}
          >
            {editing === "payment" ? (
              <RenderPaymentDetails />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <ReadonlyField label="Account holder" value={mentor.payment_details?.account_holder_name} />
                  <ReadonlyField label="Bank A/C" value={mentor.payment_details?.back_account} />
                  <ReadonlyField label="IFSC" value={<span className="uppercase">{mentor.payment_details?.ifsc_code}</span>} />
                  <ReadonlyField label="UPI" value={<span className="lowercase">{mentor.payment_details?.upi_id}</span>} />
                </div>
                {mentor.profile_pic && (
                  <img
                    src={mentor.profile_pic}
                    alt="Profile"
                    className="h-16 w-16 shrink-0 rounded-full border object-cover"
                  />
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </FormProvider>
    </DashboardLayout>
  );
};

export default ProfilePage;
