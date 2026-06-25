import { ProfileFormData } from "@/types/profilePage";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Lock, Mail, Phone, User } from "lucide-react";
import { Input } from "@/components/ui/input";

const RenderBasicInfo = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProfileFormData>();
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
            error={errors.phoneNumber ? errors.phoneNumber.message : undefined}
          />
        </div>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div> */}

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

export default RenderBasicInfo;
