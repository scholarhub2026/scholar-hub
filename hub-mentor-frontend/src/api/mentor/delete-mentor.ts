import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const deleteMentorFn = async (id: string) => {
  const res = await axiosInstance.delete(`/mentor/${id}`);
  return res.data;
};

export const useDeleteMentorMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMentorFn,
    onSuccess: () => {
      toast.success("Mentor removed");
      queryClient.invalidateQueries({ queryKey: ["mentor"] });
    },
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Failed to remove mentor");
    },
  });
};
