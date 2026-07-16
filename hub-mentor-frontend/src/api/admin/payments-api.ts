import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type PersonRef =
  | { _id: string; firstName?: string; lastName?: string; email?: string; phone?: string }
  | string
  | null;

export type PaymentRecord = {
  _id?: string;
  amount: number;
  collectedAt: string;
  note?: string;
  collectedBy?: string | null;
  periodLabel?: string;
};

/** A confirmed booking as returned by GET /booking/payments/due. */
export type DueBooking = {
  _id: string;
  studentName: string;
  email: string;
  phone: string;
  studentId?: PersonRef;
  mentorId?: PersonRef;
  totalAmount: number;
  paymentFrequency: "daily" | "weekly" | "monthly" | "";
  classStartDate?: string | null;
  nextDueDate: string;
  payments: PaymentRecord[];
  daysOverdue: number;
  dueStatus: "overdue" | "today" | "upcoming";
  bookingStatus: string;
};

export type DuePaymentsResponse = {
  message: string;
  bookings: DueBooking[];
  counts: { overdue: number; today: number; upcoming: number };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
};

export const PAYMENTS_KEY = "admin-payments";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

export type PaymentScope = "all" | "overdue" | "today" | "upcoming";

export const useGetDuePaymentsQuery = (params: {
  scope?: PaymentScope;
  page?: number;
  limit?: number;
  search?: string;
}) =>
  useQuery<DuePaymentsResponse>({
    queryKey: [PAYMENTS_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("scope", params.scope ?? "all");
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 10));
      if (params.search) q.set("search", params.search);
      return (await axiosInstance.get(`/booking/payments/due?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

/** Record a manually collected payment; advances the next due date. */
export const useRecordPaymentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      amount,
      note,
    }: {
      bookingId: string;
      amount?: number;
      note?: string;
    }) =>
      (await axiosInstance.post(`/booking/${bookingId}/payments`, { amount, note }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to record payment")),
  });
};

/** "Jane Doe" from a populated ref, or a fallback. */
export const personName = (ref?: PersonRef): string => {
  if (!ref || typeof ref === "string") return "—";
  return `${ref.firstName ?? ""} ${ref.lastName ?? ""}`.trim() || "—";
};
