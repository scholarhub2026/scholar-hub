import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PortalPage from "@/components/layout/PortalPage";
import { usePortalBase } from "@/hooks/usePortalBase";
import { Button } from "@/components/ui/button";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import Booking from "@/components/BookingPage/booking";
import Details from "@/components/BookingPage/details";
import { useCreateEnquiryMutation } from "@/api/enquiry/enquiry-api";
import { useAuth } from "@/auth/AuthProvider";
import { roleHome } from "@/config/roles";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Enquiry flow — a lead, not a booking. No slots, no payment.
const steps = [
  { id: "enquiry", name: "Enquiry" },
  { id: "details", name: "Your details" },
  { id: "review", name: "Review" },
  { id: "confirmation", name: "Sent" },
];

type EnquirySubject = { subjectId: string; name: string; price: number };

type MentorLite = {
  _id: string;
  firstName?: string;
  lastName?: string;
  selected_class?: unknown[];
};

type EnquiryForm = {
  studentName: string;
  email: string;
  phone: string;
  message: string;
  selectedSyllabus: string;
  selectedClass: {
    class_id: { _id: string; class: string; syllabus: string };
    subject: { subject_id: { _id: string; name: string }; subject_price: number }[];
  } | null;
  enquiryType: "" | "demo" | "subject-wise";
  selectedSubjects: EnquirySubject[];
};

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const base = usePortalBase();
  const [mentor, setMentor] = useState<MentorLite | null>(null);
  const { data, isSuccess, isLoading } = useGetMentorQuery({ id: id as string });
  const createEnquiry = useCreateEnquiryMutation();

  useEffect(() => {
    if (isSuccess) setMentor(data.data);
  }, [data, isSuccess]);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EnquiryForm>({
    studentName: user?.firstName ?? "",
    email: "",
    phone: "",
    message: "",
    selectedSyllabus: "",
    selectedClass: null,
    enquiryType: "",
    selectedSubjects: [],
  });

  if (!mentor) {
    if (isLoading || data?.data) {
      return (
        <PortalPage>
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        </PortalPage>
      );
    }
    return (
      <PortalPage>
        <div className="container-wide py-16 text-center">
          <h2 className="mb-4 text-2xl font-bold">Mentor not found</h2>
          <p className="mb-6 text-muted-foreground">
            The mentor you're looking for doesn't exist or has been removed.
          </p>
          <Link to={`${base}/mentors`}>
            <Button>Back to Mentors</Button>
          </Link>
        </div>
      </PortalPage>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const subjectTotal = formData.selectedSubjects.reduce(
    (acc, s) => acc + (s.price ?? 0),
    0,
  );
  const estimatedAmount =
    formData.enquiryType === "demo" ? 0 : subjectTotal;

  const submitEnquiry = () => {
    createEnquiry.mutate(
      {
        studentName: formData.studentName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        mentorId: mentor._id,
        selectedSyllabus: formData.selectedSyllabus,
        classId: formData.selectedClass?.class_id?._id,
        className: formData.selectedClass?.class_id?.class,
        enquiryType: formData.enquiryType as "demo" | "subject-wise",
        subjects: formData.selectedSubjects,
        message: formData.message.trim() || undefined,
      },
      { onSuccess: () => setCurrentStep(3) },
    );
  };

  const nextStep = () => {
    if (currentStep === 2) return submitEnquiry();
    if (currentStep < steps.length - 1) setCurrentStep((p) => p + 1);
  };
  const prevStep = () => currentStep > 0 && setCurrentStep((p) => p - 1);

  const isStepComplete = () => {
    switch (currentStep) {
      case 0:
        return (
          !!formData.selectedSyllabus &&
          !!formData.selectedClass &&
          !!formData.enquiryType &&
          (formData.enquiryType === "demo" ||
            formData.selectedSubjects.length > 0)
        );
      case 1:
        return !!formData.studentName && !!formData.email && !!formData.phone;
      default:
        return true;
    }
  };

  return (
    <PortalPage>
      <div className="container-wide py-8 md:py-12">
        {/* Progress */}
        <div className="mx-auto mb-10 max-w-2xl">
          <div className="flex items-start">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    className={cn(
                      "mt-5 h-0.5 flex-1 rounded-full transition-colors",
                      index <= currentStep ? "bg-primary" : "bg-slate-200",
                    )}
                  />
                )}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      index < currentStep
                        ? "bg-primary text-white"
                        : index === currentStep
                          ? "bg-primary text-white ring-4 ring-primary/15"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      index <= currentStep ? "text-slate-900" : "text-slate-400",
                    )}
                  >
                    {step.name}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          {currentStep === 0 && (
            <Booking formData={formData} setFormData={setFormData} mentor={mentor} />
          )}

          {currentStep === 1 && (
            <Details
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
            />
          )}

          {currentStep === 2 && (
            <div className="animate-fade-in">
              <div className="mb-8 text-center">
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Review &amp; enquire
                </h2>
                <p className="mt-1 text-slate-500">
                  We'll email our team and get back to you to arrange classes.
                </p>
              </div>

              <div className="mx-auto max-w-xl">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="space-y-3 text-sm">
                    <Row label="Mentor" value={`${mentor.firstName} ${mentor.lastName}`} />
                    {formData.selectedClass?.class_id?.class && (
                      <Row
                        label="Class"
                        value={`${formData.selectedClass.class_id.class} · ${formData.selectedSyllabus}`}
                      />
                    )}
                    <Row
                      label="Enquiry"
                      value={
                        formData.enquiryType === "demo"
                          ? "Demo class"
                          : "Subject-wise"
                      }
                    />
                    {formData.enquiryType === "subject-wise" && (
                      <Row
                        label="Subjects"
                        value={
                          formData.selectedSubjects.map((s) => s.name).join(", ") ||
                          "—"
                        }
                      />
                    )}
                    <Row label="Name" value={formData.studentName} />
                    <Row label="Contact" value={formData.phone} />
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-5 py-4">
                    <span className="font-medium text-slate-700">Indicative fee</span>
                    <span className="font-display text-xl font-bold text-slate-900">
                      {estimatedAmount > 0 ? `₹${estimatedAmount}` : "Free"}
                    </span>
                  </div>
                  <p className="mt-3 text-center text-sm text-slate-500">
                    No payment now — this is an enquiry. Our team will contact you
                    to confirm availability and fees.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fade-in mx-auto max-w-md py-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                <div className="mb-5 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Enquiry sent! 🎉
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                  Thanks {formData.studentName || "there"} — our team has your
                  enquiry and will contact you shortly to arrange classes with{" "}
                  {mentor.firstName}.
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {user ? (
                    <Link to={roleHome(user.role)} className="w-full sm:w-auto">
                      <Button className="w-full">Go to Dashboard</Button>
                    </Link>
                  ) : (
                    <Link to={`${base}/mentors`} className="w-full">
                      <Button variant="outline" className="w-full">
                        Browse more mentors
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep < 3 && (
            <div className="mx-auto mt-8 flex max-w-xl justify-between">
              {currentStep > 0 ? (
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={nextStep}
                disabled={!isStepComplete() || createEnquiry.isPending}
              >
                {currentStep === 2 ? "Enquire Now" : "Continue"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PortalPage>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium capitalize text-slate-800">{value}</span>
  </div>
);

export default BookingPage;
