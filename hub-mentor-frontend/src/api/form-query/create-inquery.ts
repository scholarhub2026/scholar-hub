import { handleCloseModal } from "@/contexts/modal-state";
import axiosInstance from "@/lib/axios";
import { TInQueryFormValues } from "@/types/inquery-form";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


const createQueryFn = async (Variable:TInQueryFormValues) => {
    const data=await axiosInstance.post("/inquery-form/",Variable);
    return data;
};

const updatesQueryFn = async (Variable:TInQueryFormValues, id:string) => {
    const data=await axiosInstance.put(`/inquery-form/${id}`, Variable);
    return data;
}

export const useCreateInqueryMutation = () => {
    return useMutation({
        mutationFn:createQueryFn,
        onSuccess: (data) => {
            toast.success("Form submitted successfully!");
        },
        onError: (error: APIErrorResponse) => {
            const message = error.response?.data?.message || "Form submission failed";
            toast.error(message);
        },
    })
}

export const useUpdateInqueryMutation = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (Variable: TInQueryFormValues) => updatesQueryFn(Variable, id),
        onSuccess: (data) => {
            toast.success("Form updated successfully!");
            // Optionally, you can trigger a refetch of the query to get the latest data
             queryClient.invalidateQueries({ queryKey: ["inquery"] });
             handleCloseModal();

        },
        onError: (error: APIErrorResponse) => {
            const message = error.response?.data?.message || "Form update failed";
            toast.error(message);
        },
    })
}


