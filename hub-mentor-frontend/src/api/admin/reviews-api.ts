import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ReviewMentorRef =
  | { _id: string; firstName?: string; lastName?: string }
  | string
  | null;

export type AdminReview = {
  _id: string;
  mentorId?: ReviewMentorRef;
  studentName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
};

export type ReviewsResponse = {
  data: AdminReview[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const REVIEWS_KEY = "admin-reviews";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

export const useGetAllReviewsQuery = (params: {
  page?: number;
  limit?: number;
  search?: string;
}) =>
  useQuery<ReviewsResponse>({
    queryKey: [REVIEWS_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 10));
      if (params.search) q.set("search", params.search);
      return (await axiosInstance.get(`/review?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

export const useDeleteReviewMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await axiosInstance.delete(`/review/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REVIEWS_KEY] });
      toast.success("Review deleted");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to delete review")),
  });
};

/** "Dr. Jane Doe" from a populated mentorId, or a fallback. */
export const mentorName = (ref?: ReviewMentorRef): string => {
  if (!ref || typeof ref === "string") return "—";
  return `${ref.firstName ?? ""} ${ref.lastName ?? ""}`.trim() || "—";
};
