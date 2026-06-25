// @ts-nocheck


import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  GraduationCap,
  Clock,
  Star,
  CreditCard,
  FileText,
  Camera,
  MessageSquare,
  Upload,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import getUserRole from "@/lib/getRole";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import NavigationButton from "@/components/profile-page/NavigationButton";
import { ProfileFormData } from "@/types/profilePage";

const ProfilePage = () => {
  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      email: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      role: "",
      password: "",
      confirmPassword: "",
      experience: "",
      education_qualification: "",
      available_slot: [{ time: "1" }],
      rating: "",
      location: "",
      selected_class: [
        {
          class_id: "",
          price: "",
          subject: { subject_id: "", subject_price: "" },
        },
      ],
      payment_details: {
        back_account: "",
        ifsc_code: "",
        branch: "",
        account_holder_name: "",
        upi_id: "",
      },
      id_proof: "",
      additional_details: "",
      gender: "",
      profile_pic: null,
      profilePicPreview: "",
      message: "",
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  // const [errors, setErrors] = useState<Record<string, string>>({});

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   if (name.includes(".")) {
  //     const [parent, child] = name.split(".");
  //     setFormData((prev) => ({
  //       ...prev,
  //       [parent]: {
  //         ...prev[parent],
  //         [child]: value,
  //       },
  //     }));
  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }
  // };

  // const handleFileUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       profile_pic: file,
  //       profilePicPreview: URL.createObjectURL(file),
  //     }));
  //   }
  // };

  // const addTimeSlot = () => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     available_slot: [...prev.available_slot, { time: "" }],
  //   }));
  // };

  // const removeTimeSlot = (index) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     available_slot: prev.available_slot.filter((_, i) => i !== index),
  //   }));
  // };

  // const updateTimeSlot = (index, value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     available_slot: prev.available_slot.map((slot, i) =>
  //       i === index ? { ...slot, time: value } : slot
  //     ),
  //   }));
  // };

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
          "location",
        ];
      case 3:
        return ["selected_class"];
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
    const isStepValid = await trigger(getFieldsForStep(currentStep)); // validate only current step's fields

    console.log("Is Step Valid:", isStepValid);
    if (!isStepValid) return;

    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    // Handle form submission
  };
  const { id } = useParams<{ id: string }>();
  const { data } = useGetMentorQuery({
    id,
  });

  useEffect(() => {
    const userDetails = data?.data || {};
    if (userDetails) {
      reset({
        ...userDetails,
      });
    }
  }, [data, reset]);

  const renderBasicInfo = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Update Profile
          </h2>
          <p className="text-gray-600">Join our learning community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-2" />
              First Name *
            </Label>

            <Input
              type="text"
              name="firstName"
              value={watch("firstName")}
              {...register("firstName", { required: "First name is required" })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your first name"
              error={errors.firstName ? errors.firstName.message : undefined}
            />
          </div>

          <div>
            {/* <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            Last Name *
          </label> */}
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-2" />
              Last Name *
            </Label>
            <Input
              type="text"
              name="lastName"
              value={watch("lastName")}
              {...register("lastName", { required: "Last name is required" })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your last name"
              error={errors.lastName ? errors.lastName.message : undefined}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline w-4 h-4 mr-2" />
              Email Address *
            </Label>
            <Input
              type="email"
              name="email"
              value={watch("email")}
              {...register("email", { required: "Email is required" })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
              error={errors.email ? errors.email.message : undefined}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline w-4 h-4 mr-2" />
              Phone Number
            </Label>
            <Input
              type="tel"
              name="phoneNumber"
              value={watch("phoneNumber")}
              {...register("phoneNumber", {
                required: "Phone number is required",
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your phone number"
              error={
                errors.phoneNumber ? errors.phoneNumber.message : undefined
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline w-4 h-4 mr-2" />
              Password *
            </Label>
            <Input
              type="password"
              name="password"
              value={watch("password")}
              {...register("password", { required: "Password is required" })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Create a password"
              error={errors.password ? errors.password.message : undefined}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline w-4 h-4 mr-2" />
              Confirm Password *
            </Label>
            <Input
              type="password"
              name="confirmPassword"
              value={watch("confirmPassword")}
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirm your password"
              error={
                errors.confirmPassword
                  ? errors.confirmPassword.message
                  : undefined
              }
            />
          </div>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </Label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="male"
                {...register("gender", { required: "Gender is required" })}
                className="mr-2"
              />
              Male
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="female"
                {...register("gender", { required: "Gender is required" })}
                className="mr-2"
              />
              Female
            </label>
          </div>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
          )}
        </div>
      </div>
    );
  };

  const renderMentorDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Mentor Details
        </h2>
        <p className="text-gray-600">Tell us about your expertise</p>
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <GraduationCap className="inline w-4 h-4 mr-2" />
          Experience
        </Label>
        <Textarea
          name="experience"
          value={watch("experience")}
          {...register("experience", {
            required: "Experience is required",
          })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe your teaching/professional experience"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          <GraduationCap className="inline w-4 h-4 mr-2" />
          Education Qualification
        </Label>
        <select
          name="education_qualification"
          {...register("education_qualification", {
            required: "Education qualification is required",
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select your qualification</option>
          <option value="High School">High School</option>
          <option value="Bachelor's Degree">Bachelor's Degree</option>
          <option value="Master's Degree">Master's Degree</option>
          <option value="PhD">PhD</option>
          <option value="Diploma">Diploma</option>
          <option value="Certificate">Certificate</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-2" />
          Location
        </label>
        <input
          type="text"
          name="location"
          value={watch("location")}
          {...register("location", { required: "Location is required" })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your location"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 mr-2" />
          ID Proof
        </label>
        <input
          type="text"
          name="id_proof"
          value={watch("id_proof")}
          {...register("id_proof", { required: "ID proof is required" })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="ID proof number or document"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline w-4 h-4 mr-2" />
          Additional Details
        </label>
        <textarea
          name="additional_details"
          value={watch("additional_details")}
          {...register("additional_details")}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional information about your teaching experience, specializations, etc."
        />
      </div>
    </div>
  );

  const renderPaymentDetails = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Details
        </h2>
        <p className="text-gray-600">Setup your payment information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="inline w-4 h-4 mr-2" />
            Bank Account
          </label>
          <input
            type="text"
            name="payment_details.back_account"
            value={watch("payment_details.back_account")}
            {...register("payment_details.back_account", {
              required: "Bank account is required",
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Account number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IFSC Code
          </label>
          <input
            type="text"
            name="payment_details.ifsc_code"
            value={watch("payment_details.ifsc_code")}
            {...register("payment_details.ifsc_code", {
              required: "IFSC code is required",
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="IFSC code"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <input
            type="text"
            name="payment_details.branch"
            value={watch("payment_details.branch")}
            {...register("payment_details.branch", {
              required: "Branch name is required",
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Branch name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name
          </label>
          <input
            type="text"
            name="payment_details.account_holder_name"
            value={watch("payment_details.account_holder_name")}
            {...register("payment_details.account_holder_name", {
              required: "Account holder name is required",
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Account holder name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          UPI ID
        </label>
        <input
          type="text"
          name="payment_details.upi_id"
          value={watch("payment_details.upi_id")}
          {...register("payment_details.upi_id", {
            required: "UPI ID is required",
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your-upi@provider"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Camera className="inline w-4 h-4 mr-2" />
          Profile Picture
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              // onChange={handleFileUpload}
              {...register("profile_pic", {
                onChange: (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    reset((prev) => ({
                      ...prev,
                      profile_pic: file,
                      profilePicPreview: URL.createObjectURL(file),
                    }));
                  }
                },
              })}
              className="hidden"
              id="profile-pic-upload"
            />
            <label
              htmlFor="profile-pic-upload"
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              {watch("profile_pic") ? "Change Image" : "Upload Profile Picture"}
            </label>
          </div>
          {watch("profilePicPreview") && (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
              <img
                src={watch("profilePicPreview")}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        {watch("profile_pic") && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {watch("profile_pic").name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline w-4 h-4 mr-2" />
          Message
        </label>
        <textarea
          name="message"
          value={watch("message")}
          {...register("message")}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any message or note"
        />
      </div>
    </div>
  );

  // const renderSubjectDetails = () => (
  //   <div className="space-y-6">

  //     <div>
  //       <label className="block text-sm font-medium text-gray-700 mb-2">
  //         <Clock className="inline w-4 h-4 mr-2" />
  //         Available Time Slots
  //       </label>
  //       {formData.available_slot.map((slot, index) => (
  //         <div key={index} className="flex items-center space-x-2 mb-2">
  //           <input
  //             type="time"
  //             value={slot.time}
  //             onChange={(e) => updateTimeSlot(index, e.target.value)}
  //             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //           />
  //           {formData.available_slot.length > 1 && (
  //             <button
  //               type="button"
  //               onClick={() => removeTimeSlot(index)}
  //               className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
  //             >
  //               Remove
  //             </button>
  //           )}
  //         </div>
  //       ))}
  //       <button
  //         type="button"
  //         onClick={addTimeSlot}
  //         className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
  //       >
  //         Add Time Slot
  //       </button>
  //     </div>

  //     <div>
  //       <label className="block text-sm font-medium text-gray-700 mb-2">
  //         <FileText className="inline w-4 h-4 mr-2" />
  //         Selected Classes & Subjects
  //       </label>
  //       <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
  //         {formData.selected_class.map((classItem, index) => (
  //           <div
  //             key={index}
  //             className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
  //           >
  //             <div>
  //               <label className="block text-sm font-medium text-gray-600 mb-1">
  //                 Class ID
  //               </label>
  //               <input
  //                 type="text"
  //                 value={classItem.class_id}
  //                 onChange={(e) => {
  //                   const newClasses = [...formData.selected_class];
  //                   newClasses[index].class_id = e.target.value;
  //                   setFormData((prev) => ({
  //                     ...prev,
  //                     selected_class: newClasses,
  //                   }));
  //                 }}
  //                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //                 placeholder="Class ID"
  //               />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-600 mb-1">
  //                 Price
  //               </label>
  //               <input
  //                 type="number"
  //                 value={classItem.price}
  //                 onChange={(e) => {
  //                   const newClasses = [...formData.selected_class];
  //                   newClasses[index].price = e.target.value;
  //                   setFormData((prev) => ({
  //                     ...prev,
  //                     selected_class: newClasses,
  //                   }));
  //                 }}
  //                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //                 placeholder="Price"
  //               />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-medium text-gray-600 mb-1">
  //                 Subject ID
  //               </label>
  //               <input
  //                 type="text"
  //                 value={classItem.subject.subject_id}
  //                 onChange={(e) => {
  //                   const newClasses = [...formData.selected_class];
  //                   newClasses[index].subject.subject_id = e.target.value;
  //                   setFormData((prev) => ({
  //                     ...prev,
  //                     selected_class: newClasses,
  //                   }));
  //                 }}
  //                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //                 placeholder="Subject ID"
  //               />
  //             </div>
  //           </div>
  //         ))}
  //         <button
  //           type="button"
  //           onClick={() => {
  //             setFormData((prev) => ({
  //               ...prev,
  //               selected_class: [
  //                 ...prev.selected_class,
  //                 {
  //                   class_id: "",
  //                   price: "",
  //                   subject: { subject_id: "", subject_price: "" },
  //                 },
  //               ],
  //             }));
  //           }}
  //           className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
  //         >
  //           Add Another Class
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );

  const getStepContent = () => {
    console.log("Current Step:", currentStep);

    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderMentorDetails();
      // case 3:
      // return renderSubjectDetails();

      case 4:
        return renderPaymentDetails();
      default:
        return renderBasicInfo();
    }
  };

  const getTotalSteps = () => {
    return 4;
  };

  return (
    <DashboardLayout userRole={getUserRole()}>
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
          <form onSubmit={handleSubmit(onSubmit)}>
            {getStepContent()}
            <NavigationButton
              currentStep={currentStep}
              prevStep={prevStep}
              nextStep={nextStep}
              getTotalSteps={getTotalSteps}
            />
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
