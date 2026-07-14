import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type EarningTxn = {
  _id: string;
  studentName?: string;
  totalAmount: number;
  createdAt?: string;
  sessionMode?: string;
  bookingType?: string;
};

export type MentorEarnings = {
  totalEarnings: number;
  totalSessions: number;
  thisMonthEarnings: number;
  thisMonthSessions: number;
  pendingEarnings: number;
  pendingSessions: number;
  recent: EarningTxn[];
};

// GET /api/booking/mentor/:mentorId/earnings  (B3)
export const useMentorEarningsQuery = (mentorId?: string) =>
  useQuery<MentorEarnings>({
    queryKey: ["mentor-earnings", mentorId],
    enabled: !!mentorId,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (await axiosInstance.get(`/booking/mentor/${mentorId}/earnings`)).data.data,
  });
