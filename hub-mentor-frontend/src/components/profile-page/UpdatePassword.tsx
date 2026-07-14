import DashboardLayout from "../dashboard/DashboardLayout";
import { useAuth } from "@/auth/AuthProvider";
import { roleSlug } from "@/config/roles";
import { Label } from "../ui/label";
import { User } from "lucide-react";
import { Input } from "../ui/input";
import { ProfileFormData } from "@/types/profilePage";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useUpdateMentorMutation } from "@/api/mentor/update-mentor";
import { useUpdatePasswordMutation } from "@/api/auth/updatePassword";
import { useEffect, useState } from "react";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";

const UpdatePassword = () => {
  const {
    register,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm<ProfileFormData>();

  const { user } = useAuth();
  const userId = user?.id;
  const role = roleSlug(user?.role);

  const { mutate: updatePassword } = useUpdatePasswordMutation();
  const { mutate: updateAvailability } = useUpdateMentorMutation();

  const [isAvailable, setIsAvailable] = useState(false);

  const { data } = useGetMentorQuery({
    id: userId,
    page: 1,
    limit: 1000000000,
    type: "approve",
  });

  // ✅ Correct useEffect dependency (only data)
  useEffect(() => {
    setIsAvailable(data?.data?.is_available);
  }, [data]);

  // ✅ Clean checkbox handler
 const handleCheckboxChange = ({ target: { checked } }) => {
  setIsAvailable(checked);
  updateAvailability({
    id: userId,
    data: {
      is_available: checked,
    },
  });
};

  // ✅ Submit handler for password update
  const onSubmit = (data: ProfileFormData) => {
    updatePassword({
      id: userId,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <DashboardLayout userRole={role}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Update Profile</h2>
            <p className="text-gray-600">Join our learning community</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Password
                </Label>

                <Input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    pattern: {
                      value:
                        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message:
                        "Password must be at least 8 characters long, include one uppercase letter, one number, and one special character",
                    },
                  })}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Confirm Password
                </Label>

                <Input
                  type="password"
                  {...register("confirmPassword", {
                    required: "Confirm Password is required",
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-6">
              <Button type="submit">Update Password</Button>
            </div>

            {/* Mentor Availability Toggle */}
            {role === "mentor" && (
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <Label className="flex items-center text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Available
                </Label>

                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5 accent-blue-600 cursor-pointer transition-transform duration-200 hover:scale-110"
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UpdatePassword;
