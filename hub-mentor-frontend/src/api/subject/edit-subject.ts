import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const updateSubjectFn = async ({ id, payload }) => {
  const response = await axiosInstance.put(`/subject/${id}`, payload);
  if (!response || !response.data) {
    throw new Error("Failed to update subject");
  }
  return response.data;
};


export const useUpdateSubjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject"] });
      toast.success("Subject updated successfully");
    },
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Error updating subject");
      console.error("Error updating subject:", error);
    },
  });
};
