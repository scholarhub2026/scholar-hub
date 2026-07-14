import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// POST /api/mentor/:id/resend-credentials — regenerate + re-email a mentor's password.
export const useResendCredentialsMutation = () =>
  useMutation({
    mutationFn: async (id: string) =>
      (await axiosInstance.post(`/mentor/${id}/resend-credentials`)).data,
    onError: (error: APIErrorResponse) => {
      toast.error(error.response?.data?.message || "Failed to resend credentials");
    },
  });
