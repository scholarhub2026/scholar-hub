import axiosInstance from "@/lib/axios"
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const createMentorFn=async(data)=>{
    const res=await axiosInstance.post("/mentor",data);
    return res
}

export const useCreateMentorMutation=()=>{
    return useMutation({
        mutationFn:createMentorFn,
        onSuccess:(data)=>{
            toast.success("Form Submitted successfully!");
        },
        onError:(error:APIErrorResponse)=>{
            toast.error(error.response.data.message||"Form failed to Submit")
        }
    })
}