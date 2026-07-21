import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

export type EnquiryType = "demo" | "subject-wise";
export type EnquiryStatus = "new" | "contacted" | "converted" | "closed";

export type EnquirySubject = { subjectId?: string; name: string; price: number };

export type EnquiryRecord = {
  _id: string;
  studentName: string;
  email: string;
  phone: string;
  mentorId: string;
  mentorName?: string;
  selectedSyllabus?: string;
  classId?: string | null;
  className?: string;
  enquiryType: EnquiryType;
  subjects: EnquirySubject[];
  estimatedAmount: number;
  message?: string;
  status: EnquiryStatus;
  bookingId?: string | null;
  createdAt?: string;
};

export type CreateEnquiryBody = {
  studentName: string;
  email: string;
  phone: string;
  mentorId: string;
  selectedSyllabus?: string;
  classId?: string;
  className?: string;
  enquiryType: EnquiryType;
  subjects?: EnquirySubject[];
  message?: string;
};

export const ENQUIRIES_KEY = "admin-enquiries";

/** Public — submit a class enquiry (no payment/booking). */
export const useCreateEnquiryMutation = () =>
  useMutation({
    mutationFn: async (body: CreateEnquiryBody) =>
      (await axiosInstance.post(`/enquiry`, body)).data,
    onError: (e) => toast.error(errMessage(e, "Couldn't send your enquiry")),
  });

export type EnquiryScope = "all" | EnquiryStatus;

export const useEnquiriesQuery = (params: {
  scope?: EnquiryScope;
  page?: number;
  limit?: number;
  search?: string;
}) =>
  useQuery<{
    enquiries: EnquiryRecord[];
    counts: Record<EnquiryStatus, number>;
    pagination: { currentPage: number; totalPages: number; totalRecords: number };
  }>({
    queryKey: [ENQUIRIES_KEY, params],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("scope", params.scope ?? "all");
      q.set("page", String(params.page ?? 1));
      q.set("limit", String(params.limit ?? 10));
      if (params.search) q.set("search", params.search);
      return (await axiosInstance.get(`/enquiry?${q.toString()}`)).data;
    },
    refetchOnWindowFocus: false,
  });

export const useUpdateEnquiryStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EnquiryStatus }) =>
      (await axiosInstance.patch(`/enquiry/${id}`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENQUIRIES_KEY] });
      toast.success("Enquiry updated");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to update the enquiry")),
  });
};

/** Admin — create a confirmed flat-fee booking (from an enquiry). */
export const useAdminCreateBookingMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      enquiryId?: string;
      studentName: string;
      email: string;
      phone: string;
      mentorId: string;
      classId?: string;
      className?: string;
      selectedSyllabus?: string;
      subjects?: EnquirySubject[];
      bookingType?: string;
      totalAmount: number;
      paymentFrequency: "weekly" | "monthly";
      classStartDate: string;
    }) => (await axiosInstance.post(`/booking/admin`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENQUIRIES_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created — student & mentor notified");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to create the booking")),
  });
};
