import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

const cancelBooking = async (bookingId: string) => {
  const { data } = await axiosInstance.patch(`/booking/${bookingId}/cancel`);
  return data;
};

export const useCancelBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking cancelled");
    },
    onError: (error: any) => {
      console.error("Error cancelling booking:", error);
      toast.error(
        error?.response?.data?.message || "Failed to cancel booking",
      );
    },
  });
};
