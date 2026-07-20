import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

export type SettlementRecord = {
  _id: string;
  settlementNumber: string;
  mentorId: string;
  mentorName?: string;
  invoiceIds: string[];
  amount: number;
  method: "bank-transfer" | "upi" | "cash" | "other";
  reference?: string;
  note?: string;
  paidAt: string;
  status: "recorded" | "void";
  createdAt?: string;
};

export type PendingByMentor = {
  _id: string; // mentorId
  mentorName?: string;
  total: number;
  invoices: Array<{ _id: string; invoiceNumber: string; amount: number }>;
};

export const SETTLEMENTS_KEY = "admin-settlements";

export const useSettlementsQuery = (params: { page?: number; limit?: number } = {}) =>
  useQuery<{
    settlements: SettlementRecord[];
    pendingByMentor: PendingByMentor[];
    pagination: { currentPage: number; totalPages: number; totalRecords: number };
  }>({
    queryKey: [SETTLEMENTS_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 20));
      return (await axiosInstance.get(`/settlements?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

/** The mentor's own received payouts. */
export const useMentorSettlementsQuery = () =>
  useQuery<{ settlements: SettlementRecord[]; totalReceived: number }>({
    queryKey: ["mentor-settlements"],
    queryFn: async () => (await axiosInstance.get(`/settlements/mentor`)).data,
    refetchOnWindowFocus: false,
  });

/** Admin: record a direct payout to a mentor (no platform commission). */
export const useCreateSettlementMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      mentorId: string;
      invoiceIds: string[];
      amount?: number;
      method?: "bank-transfer" | "upi" | "cash" | "other";
      reference?: string;
      note?: string;
    }) => (await axiosInstance.post(`/settlements`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SETTLEMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Payout recorded — the mentor has been notified");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to record the payout")),
  });
};

export const useVoidSettlementMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      settlementId,
      reason,
    }: {
      settlementId: string;
      reason?: string;
    }) =>
      (await axiosInstance.post(`/settlements/${settlementId}/void`, { reason }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SETTLEMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Settlement voided — its invoices are back to paid");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to void the settlement")),
  });
};
