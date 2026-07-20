import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

export type SessionStatus = "logged" | "verified" | "rejected";

export type SessionRecord = {
  _id: string;
  bookingId:
    | string
    | {
        _id: string;
        studentName?: string;
        bookingType?: string;
        paymentFrequency?: string;
        selectedSyllabus?: string;
        selectedClass?: { class_id?: { class?: string } };
      };
  mentorId?: { _id: string; firstName?: string; lastName?: string } | string;
  studentId?: { _id: string; firstName?: string; email?: string } | string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  subjectId?: string | null;
  subjectName?: string;
  notes?: string;
  status: SessionStatus;
  rejectReason?: string;
  invoiceId?: string | null;
  createdAt?: string;
};

export type SessionsResponse = {
  sessions: SessionRecord[];
  counts: { logged: number };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
};

export const SESSIONS_KEY = "sessions";

export const useSessionsQuery = (params: {
  bookingId?: string;
  status?: SessionStatus | "";
  page?: number;
  limit?: number;
}) =>
  useQuery<SessionsResponse>({
    queryKey: [SESSIONS_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.bookingId) q.set("bookingId", params.bookingId);
      if (params.status) q.set("status", params.status);
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 20));
      return (await axiosInstance.get(`/sessions?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

export const useLogSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      bookingId: string;
      date: string; // "YYYY-MM-DD"
      startTime: string;
      endTime: string;
      subjectId?: string;
      notes?: string;
    }) => (await axiosInstance.post(`/sessions`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] });
      toast.success("Session logged — awaiting admin verification");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to log the session")),
  });
};

export const useUpdateSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      ...body
    }: {
      sessionId: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      notes?: string;
    }) => (await axiosInstance.patch(`/sessions/${sessionId}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] });
      toast.success("Session updated");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to update the session")),
  });
};

export const useDeleteSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) =>
      (await axiosInstance.delete(`/sessions/${sessionId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] });
      toast.success("Session deleted");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to delete the session")),
  });
};

export const useVerifySessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) =>
      (await axiosInstance.patch(`/sessions/${sessionId}/verify`)).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success(
        data?.invoice
          ? "Session verified — invoice generated"
          : "Session verified",
      );
    },
    onError: (e) => toast.error(errMessage(e, "Failed to verify the session")),
  });
};

export const useRejectSessionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      reason,
    }: {
      sessionId: string;
      reason?: string;
    }) =>
      (await axiosInstance.patch(`/sessions/${sessionId}/reject`, { reason }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] });
      toast.success("Session rejected");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to reject the session")),
  });
};
