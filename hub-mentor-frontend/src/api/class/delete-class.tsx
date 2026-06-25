import axiosInstance from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const deleteClass = async (classId: string) => {
  const response = await axiosInstance.delete(`/classes/${classId}`);
  if (!response || !response.data) {
    throw new Error("Failed to delete class");
  }
  return response.data;
}

export const useDeleteClassMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting class");
      console.error("Error deleting class:", error);
    },
  });
};
