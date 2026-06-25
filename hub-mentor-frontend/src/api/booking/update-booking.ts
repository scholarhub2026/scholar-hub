import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";


const updateBooking = async ({ bookingId, updateData }) => {
  const { data } = await axiosInstance.put(`/booking/${bookingId}`, updateData);
  return data;
};

export const useUpdateBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBooking,

    onSuccess: (data) => {
      // ✅ Optional: refetch the bookings list after update
       queryClient.invalidateQueries({ queryKey: ["bookings"] });

      // You can also log or show a toast here
       toast.success("Booking updated successfully");
    },

    onError: (error) => {
      console.error("Error updating booking:", error);
        toast.error("Failed to update booking");
    },
  });
};
