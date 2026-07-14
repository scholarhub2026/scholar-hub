import axiosInstance from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type CreateReviewInput = {
  studentId: string;
  mentorId: string;
  rating: number;
  comment?: string;
  bookingId?: string;
};

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

// POST /api/review — a student rates a mentor they've booked.
export const useCreateReviewMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewInput) =>
      (await axiosInstance.post("/review", input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor-reviews"] });
      toast.success("Thanks for your review!");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to submit review")),
  });
};
