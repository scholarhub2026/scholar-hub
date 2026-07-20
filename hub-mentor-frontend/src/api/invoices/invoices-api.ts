import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

export type InvoiceStatus = "payment_due" | "paid" | "settled" | "void";

export type InvoiceLineItem = {
  description: string;
  subjectId?: string | null;
  sessionIds: string[];
  quantity: number;
  unit: "session" | "hour";
  rate: number;
  amount: number;
};

export type InvoiceRecord = {
  _id: string;
  invoiceNumber: string;
  bookingId: string;
  studentId: string;
  mentorId: string;
  studentName?: string;
  email?: string;
  mentorName?: string;
  bookingType?: string;
  paymentFrequency?: string;
  periodStart: string;
  periodEnd: string;
  periodLabel?: string;
  lineItems: InvoiceLineItem[];
  amount: number;
  status: InvoiceStatus;
  paidAt?: string | null;
  daysOverdue?: number;
  createdAt?: string;
};

export type InvoicesResponse = {
  invoices: InvoiceRecord[];
  counts: { due: number; paid: number; settled: number };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
};

export const INVOICES_KEY = "admin-invoices";

export type InvoiceScope = "all" | "due" | "overdue" | "paid" | "settled";

export const useInvoicesQuery = (params: {
  scope?: InvoiceScope;
  page?: number;
  limit?: number;
  search?: string;
}) =>
  useQuery<InvoicesResponse>({
    queryKey: [INVOICES_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("scope", params.scope ?? "due");
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 10));
      if (params.search) q.set("search", params.search);
      return (await axiosInstance.get(`/invoices?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

/** The student's own invoices (fee statements). */
export const useMyInvoicesQuery = () =>
  useQuery<{ invoices: InvoiceRecord[] }>({
    queryKey: ["my-invoices"],
    queryFn: async () => (await axiosInstance.get(`/invoices/mine`)).data,
    refetchOnWindowFocus: false,
  });

/** The mentor's invoices + earnings summary. */
export const useMentorInvoicesQuery = () =>
  useQuery<{
    invoices: InvoiceRecord[];
    summary: { billed: number; collected: number; settled: number };
  }>({
    queryKey: ["mentor-invoices"],
    queryFn: async () => (await axiosInstance.get(`/invoices/mentor`)).data,
    refetchOnWindowFocus: false,
  });

export const useInvoiceDetailQuery = (invoiceId?: string) =>
  useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () =>
      (await axiosInstance.get(`/invoices/${invoiceId}`)).data as {
        invoice: InvoiceRecord;
        sessions: Array<{
          _id: string;
          date: string;
          startTime: string;
          endTime: string;
          durationMinutes: number;
          subjectName?: string;
        }>;
        payment: { receiptNumber: string; method: string; collectedAt: string } | null;
      },
    enabled: Boolean(invoiceId),
    refetchOnWindowFocus: false,
  });

/** Admin: close the current billing cycle early for a booking. */
export const useGenerateInvoiceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) =>
      (await axiosInstance.post(`/invoices/generate`, { bookingId })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success(data?.invoice ? "Invoice generated" : data?.message ?? "Done");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to generate the invoice")),
  });
};

/**
 * Admin: record a manually collected payment against an invoice. The backend
 * marks it paid, writes the receipt ledger entry and EMAILS the receipt.
 */
export const useRecordInvoicePaymentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      method,
      note,
    }: {
      invoiceId: string;
      method?: "cash" | "upi" | "bank-transfer" | "other";
      note?: string;
    }) =>
      (await axiosInstance.post(`/invoices/${invoiceId}/payments`, { method, note }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVOICES_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-settlements"] });
      toast.success("Payment recorded — receipt emailed to the student");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to record the payment")),
  });
};

export const useResendReceiptMutation = () =>
  useMutation({
    mutationFn: async (invoiceId: string) =>
      (await axiosInstance.post(`/invoices/${invoiceId}/resend-receipt`)).data,
    onSuccess: () => toast.success("Receipt re-sent to the student"),
    onError: (e) => toast.error(errMessage(e, "Failed to resend the receipt")),
  });

export const useVoidInvoiceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      reason,
    }: {
      invoiceId: string;
      reason?: string;
    }) =>
      (await axiosInstance.post(`/invoices/${invoiceId}/void`, { reason })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success("Invoice voided — its sessions can be re-billed");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to void the invoice")),
  });
};

export const useVoidPaymentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      reason?: string;
    }) => (await axiosInstance.post(`/payments/${paymentId}/void`, { reason })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success("Payment voided — the invoice is due again");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to void the payment")),
  });
};
