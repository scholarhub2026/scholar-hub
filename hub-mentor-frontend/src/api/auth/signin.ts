import axiosInstance from "@/lib/axios";
import { APIErrorResponse, TSignupFormValues } from "@/types/loginPage";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signinFn=async(Variables:TSignupFormValues)=>{
    const data=await axiosInstance.post("/auth/signin",Variables);
    return data;
}

export const useSignupMutation=()=>{
    const navigation=useNavigate();
    return useMutation({
        mutationFn:signinFn,
        onSuccess:(data)=>{
            // localStorage.setItem("token",data.data.token);
              window.location.reload();
        },
        onError:(error:APIErrorResponse)=>{
            toast.error(error.response?.data?.message || "Signup failed");
        }
    })
}