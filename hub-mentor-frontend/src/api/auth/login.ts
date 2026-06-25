import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { APIErrorResponse } from "@/types/loginPage";
import { store } from "@/contexts/store";


const loginFn = async (variables: { email: string; password: string }) => {
  const data = await axiosInstance.post("/auth/login", variables);
  return data;
};

export const useLoginMutation = () => {
  const navigation = useNavigate();
  return useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      
     
      localStorage.setItem("token", data.data.token);
      store.loggedUser = {
        id: data.data.user.id,
        firstName: data.data.user.firstName,
        lastName: data.data.user.lastName,
        email: data.data.user.email,
        role: data.data.user.role,
        completedProfile: data.data.user.completedProfile,
        is_first_login: data.data.user.is_first_login,
      };
      
      navigation("/dashboard");
      toast.success("Login successful");
    },
    onError: (error: APIErrorResponse) => {
      console.log(error);

      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    },
  });
};
