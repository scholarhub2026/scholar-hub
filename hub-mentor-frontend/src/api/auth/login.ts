import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { APIErrorResponse } from "@/types/loginPage";
import { useAuth } from "@/auth/AuthProvider";
import { roleHome } from "@/config/roles";

const loginFn = async (variables: { email: string; password: string }) => {
  const data = await axiosInstance.post("/auth/login", variables);
  return data;
};

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  return useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      const { token, user } = data.data;
      const authedUser = login(token, user);
      toast.success("Login successful");
      navigate(roleHome(authedUser.role));
    },
    onError: (error: APIErrorResponse) => {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    },
  });
};
