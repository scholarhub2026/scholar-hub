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
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep} of {getTotalSteps()}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round((currentStep / getTotalSteps()) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / getTotalSteps()) * 100}%` }}
            ></div>
          </div>
        </div>
       
        <div>
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
