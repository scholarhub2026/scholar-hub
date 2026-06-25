import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const createSubjectFn = async (data) => {
  const response = await axiosInstance.post("/subject/subject", data);
  if (!response || !response.data) {
    throw new Error("Failed to create subject");
  }
  return response.data;
};

export const useCreateSubjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubjectFn,
    onSuccess: (data) => {
      // Invalidate the 'subject' query to refetch the updated list of subjects
      queryClient.invalidateQueries({ queryKey: ["subject"] });
      toast.success("Subject created successfully");
    },
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Error creating subject");
      console.error("Error creating subject:", error);
    },
  });
};
