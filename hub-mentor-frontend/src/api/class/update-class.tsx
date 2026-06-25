import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const updateClass = async ({ id, classData }: { id: string; classData }) => {
  const response = await axiosInstance.put(`/classes/${id}`, classData);
  if (!response || !response.data) {
    throw new Error("Failed to update class");
  }
  return response.data;
};

export const useUpdateClassMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClass,
    onSuccess: (data) => {
      // Invalidate or refetch the classes list to reflect the update
      queryClient.invalidateQueries({ queryKey: ["classes"] });

      toast.success("Class updated successfully");
    },
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Error updating class");
      console.error("Error updating class:", error);
    },
  });
};
