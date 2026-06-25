import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const createClass = async (classData) => {
  const response = await axiosInstance.post("/classes", classData);
  if (!response || !response.data) {
    throw new Error("Failed to create class");
  }
  return response.data;
};

export const useCreateClassMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createClass,
        onSuccess: (data) => {
        // Invalidate the 'classes' query to refetch the updated list of classes
       queryClient.invalidateQueries({ queryKey: ["classes"] });

        toast.success("Class created successfully");
        // Optionally, you can trigger a refetch of classes or show a success message
        },
        onError: (error:APIErrorResponse) => {
            toast.error(error.response.data.message || "Error creating class");
        console.error("Error creating class:", error);
        // Handle error, e.g., show a toast notification
        },
    });
}