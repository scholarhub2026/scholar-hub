import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { useParams, useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import NavigationButton from "@/components/profile-page/NavigationButton";
import RenderBasicInfo from "@/components/profile-page/renderBasicInfo";
import RenderMentorDetails from "@/components/profile-page/RenderMentorDetails";
import RenderPaymentDetails from "@/components/profile-page/RengerPaymentDetails";
import RenderSubjectDetails from "@/components/profile-page/RenderSubjectDetails";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import { useAuth } from "@/auth/AuthProvider";
import { roleSlug, roleHome } from "@/config/roles";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { User, GraduationCap, BookOpen, CreditCard } from "lucide-react";

const STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Mentor Details", icon: GraduationCap },
  { id: 3, label: "Subjects & Pricing", icon: BookOpen },
  { id: 4, label: "Payment", icon: CreditCard },
];

const ProfilePage = () => {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const role = roleSlug(user?.role);
  const methods = useForm({
    mode: "onSubmit",
  });
  const { handleSubmit, trigger, reset, clearErrors, getValues } = methods;

  const [currentStep, setCurrentStep] = useState(1);

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 1:
        return [
          "firstName",
          "lastName",
          "email",
          "phoneNumber",
          "password",
          "confirmPassword",
          "gender",
        ];
      case 2:
        return [
          "experience",
          "education_qualification",
          "available_slot",
          "rating",
          "id_proof",
          "location",
        ];
      // case 3:
      //   return ["selected_class"];
      case 4:
        return [
          "payment_details.back_account",
          "payment_details.ifsc_code",
          "payment_details.branch",
          "payment_details.account_holder_name",
          "payment_details.upi_id",
        ];
      default:
        return [];
    }
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fields);

    if (!isStepValid) return;

    clearErrors();

    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };
  const { mutate } = useUpdateMentorMutation();

  const { id } = useParams<{ id: string }>();
  const { data } = useGetMentorQuery({
    id,
  });

  const onSubmit = (formData) => {
    mutate(
      {
        id,
        // Mark the profile complete so the "incomplete" banner clears and the
        // mentor becomes visible to students.
        data: { ...formData, is_first_login: false, completed_profile: true },
      },
      {
        onSuccess: async () => {
          // Refresh the session so the in-memory user reflects the completion,
          // then send the mentor to their dashboard.
          await refresh();
          navigate(roleHome(user?.role));
        },
      },
    );
  };

  useEffect(() => {
    const userDetails = data?.data || {};
    if (userDetails) {
      reset({
        ...userDetails,
      });
    }
  }, [data, reset]);

  const getStepContent = () => {
    if (currentStep < 1 || currentStep > 4) {
      return <div>Invalid step</div>;
    }
    switch (currentStep) {
      case 1:
        return <RenderBasicInfo />;
      case 2:
        return <RenderMentorDetails />;
      case 3:
        return <RenderSubjectDetails />;

      case 4:
        return <RenderPaymentDetails />;
      default:
        return <RenderBasicInfo />;
    }
  };

  const getTotalSteps = () => {
    return 4;
  };

  return (
    <DashboardLayout userRole={role}>
      <PageHeader
        title="My Profile"
        description="Complete or update your details. Jump to any section from the left."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Left step tabs — jump directly to any section */}
        <nav className="h-fit rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm lg:sticky lg:top-20">
          {STEPS.map((s) => {
            const active = currentStep === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    active ? "bg-primary text-white" : "bg-slate-200 text-slate-600",
                  )}
                >
                  {s.id}
                </span>
                <Icon className="hidden h-4 w-4 shrink-0 sm:inline lg:hidden xl:inline" />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Step content */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {getStepContent()}
              <NavigationButton
                currentStep={currentStep}
                prevStep={prevStep}
                nextStep={nextStep}
                getTotalSteps={getTotalSteps}
              />
            </form>
          </FormProvider>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
