import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type ReferredUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  createdAt?: string;
};

export type ReferralData = {
  referralCode: string;
  referralCount: number;
  rewardBalance: number;
  referredUsers: ReferredUser[];
};

// GET /api/referral/:id — the logged-in user's own referral stats.
export const useReferralQuery = (userId?: string) =>
  useQuery<ReferralData>({
    queryKey: ["referral", userId],
    enabled: !!userId,
    refetchOnWindowFocus: false,
    queryFn: async () => (await axiosInstance.get(`/referral/${userId}`)).data.data,
  });
