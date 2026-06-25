import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

const updateMentorFn = async ({ id, data }) => {
  const res = await axiosInstance.put(`/mentor/${id}`, data); // or .put if your API uses PUT
  return res;
};

export const useUpdateMentorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMentorFn,
    onSuccess: () => {
      toast.success("Mentor updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["mentor"] });
    },
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Failed to update mentor");
    },
  });
};
