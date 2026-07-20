import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

export const MENTOR_REQUESTS_KEY = "mentor-booking-requests";

export type RequestBooking = {
  _id: string;
  studentName?: string;
  email?: string;
  phone?: string;
  selectedSyllabus?: string;
  bookingType?: string;
  selectedSubjects?: string[];
  paymentFrequency?: string;
  classStartDate?: string | null;
  message?: string;
  approvedAt?: string;
  studentId?: { firstName?: string; email?: string; phone?: string };
  selectedClass?: { class_id?: { class?: string; syllabus?: string } };
};

/** Bookings approved by the admin, awaiting THIS mentor's acceptance. */
export const useMentorRequestsQuery = () =>
  useQuery({
    queryKey: [MENTOR_REQUESTS_KEY],
    queryFn: async () =>
      (await axiosInstance.get(`/booking/mentor/requests`)).data as {
        bookings: RequestBooking[];
      },
    refetchOnWindowFocus: false,
  });

export const useTeacherAcceptMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) =>
      (await axiosInstance.patch(`/booking/${bookingId}/teacher-accept`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENTOR_REQUESTS_KEY] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking accepted — the student has been notified");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to accept the booking")),
  });
};

export const useTeacherDeclineMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason?: string;
    }) =>
      (
        await axiosInstance.patch(`/booking/${bookingId}/teacher-decline`, {
          reason,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENTOR_REQUESTS_KEY] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking declined");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to decline the booking")),
  });
};

/** Admin: classes are over — stops session logging, raises the final invoice. */
export const useCompleteBookingMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) =>
      (await axiosInstance.patch(`/booking/${bookingId}/complete`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Booking completed — final invoice raised if anything was unbilled");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to complete the booking")),
  });
};

/** Admin: terminal state — only when every invoice is settled. */
export const useCloseBookingMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) =>
      (await axiosInstance.patch(`/booking/${bookingId}/close`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking closed");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to close the booking")),
  });
};
