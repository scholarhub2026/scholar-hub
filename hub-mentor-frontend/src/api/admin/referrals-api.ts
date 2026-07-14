import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type ReferralRow = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  referralCode?: string;
  referralCount: number;
  rewardBalance: number;
};

export type ReferralOverviewResponse = {
  data: ReferralRow[];
  summary: { totalReferrals: number; totalRewards: number };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const useReferralOverviewQuery = (params: { page?: number; limit?: number }) =>
  useQuery<ReferralOverviewResponse>({
    queryKey: ["admin-referrals", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 10));
      return (await axiosInstance.get(`/referral?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });
