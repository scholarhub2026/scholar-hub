import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { roleHome } from "@/config/roles";

// ✅ Define the request type (you can adjust fields as per your API)
interface UpdatePasswordPayload {
  id: string; // user ID
  password?: string;
  confirmPassword?: string;
  is_available?:boolean;
}

// ✅ Define the expected API error shape
interface APIErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ✅ API call function
const updatePasswordFn = async (variables: UpdatePasswordPayload) => {
  const { id, ...payload } = variables;
  const { data } = await axiosInstance.put(`/auth/${id}`, payload);
  return data;
};

// ✅ Custom mutation hook
export const useUpdatePasswordMutation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return useMutation({
    mutationFn: updatePasswordFn,
    onSuccess: (data) => {
      toast.success(data.message || "Password updated successfully!");
      navigate(roleHome(user?.role));
    },
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Failed to update password");
    },
  });
};
