import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

const deleteBooking = async (bookingId: string) => {
  const { data } = await axiosInstance.delete(`/booking/${bookingId}`);
  return data;
};

export const useDeleteBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking deleted");
    },
    onError: (error) => {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    },
  });
};
