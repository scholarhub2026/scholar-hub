import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type MentorReview = {
  _id: string;
  studentName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
};

export type MentorReviewsResponse = {
  data: MentorReview[];
  average: number;
  count: number;
  page: number;
  limit: number;
  totalPages: number;
};

// GET /api/review/mentor/:mentorId — public; used by the mentor to see their own.
export const useMentorReviewsQuery = (
  mentorId?: string,
  page = 1,
  limit = 20,
) =>
  useQuery<MentorReviewsResponse>({
    queryKey: ["mentor-reviews", mentorId, page, limit],
    enabled: !!mentorId,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (await axiosInstance.get(`/review/mentor/${mentorId}?page=${page}&limit=${limit}`))
        .data,
  });
