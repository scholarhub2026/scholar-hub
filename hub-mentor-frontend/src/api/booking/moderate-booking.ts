import axiosInstance from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PAYMENTS_KEY } from "@/api/admin/payments-api";

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

/** Admin approves a pending booking → confirmed + payment schedule starts. */
export const useApproveBookingMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) =>
      (await axiosInstance.patch(`/booking/${bookingId}/approve`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      toast.success("Booking approved — student & mentor notified");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to approve booking")),
  });
};

/** Admin rejects a pending booking (optional reason) → cancelled + student notified. */
export const useRejectBookingMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      (await axiosInstance.patch(`/booking/${bookingId}/reject`, { reason })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      toast.success("Booking rejected — student notified");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to reject booking")),
  });
};
