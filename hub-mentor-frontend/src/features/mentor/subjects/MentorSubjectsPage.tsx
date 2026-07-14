import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import RenderSubjectDetails from "@/components/profile-page/RenderSubjectDetails";

const MentorSubjectsPage = () => {
  const { user, refresh } = useAuth();
  const mentorId = user?.id;

  const methods = useForm();
  const { reset, getValues } = methods;

  const { data, isLoading } = useGetMentorQuery({ id: mentorId });
  const mentor: any = data?.data || {};
  const { mutate, isPending } = useUpdateMentorMutation();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data?.data) reset({ ...data.data });
  }, [data, reset]);

  const cancel = () => {
    reset({ ...(data?.data || {}) });
    setEditing(false);
  };

  const save = () => {
    mutate(
      {
        id: mentorId,
        data: { ...getValues(), is_first_login: false, completed_profile: true },
      },
      {
        onSuccess: async () => {
          await refresh();
          setEditing(false);
        },
      },
    );
  };

  const classes = Array.isArray(mentor.selected_class) ? mentor.selected_class : [];

  return (
    <DashboardLayout userRole="mentor">
      <PageHeader
        title="Subjects & Pricing"
        description="Choose the classes and subjects you teach, and set your price for each."
        action={
          !editing && !isLoading ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          ) : null
        }
      />

      <div className="max-w-3xl">
        <Card className="rounded-xl border-slate-200/80 shadow-sm">
          <CardContent className="py-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : editing ? (
              <FormProvider {...methods}>
                <RenderSubjectDetails mentorId={mentorId} />
                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button variant="ghost" onClick={cancel} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button onClick={save} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </div>
              </FormProvider>
            ) : classes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
                You haven't selected any classes yet. Click <b>Edit</b> to add the
                classes and subjects you teach.
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map((cls: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-slate-800">
                        {cls.class_id?.class ?? "Class"}
                        {cls.class_id?.syllabus ? ` · ${cls.class_id.syllabus}` : ""}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        ₹{cls.price}
                      </span>
                    </div>
                    {Array.isArray(cls.subject) && cls.subject.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cls.subject.map((sub: any, j: number) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            <span className="capitalize">
                              {sub.subject_id?.name ?? "Subject"}
                            </span>
                            <span className="text-primary/60">₹{sub.subject_price}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MentorSubjectsPage;
