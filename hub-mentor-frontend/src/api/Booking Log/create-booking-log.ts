import { handleCloseModal } from "@/contexts/modal-state";
import axiosInstance from "@/lib/axios";
import { APIErrorResponse } from "@/types/loginPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// API call
const createBookingLog = async ({ bookingId, logData }) => {
  const response = await axiosInstance.post(`/bookingLog/${bookingId}`, logData);
  return response.data;
};

// Hook
export const useCreateBookingLogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingLog,
    onSuccess: (data) => {
      // Invalidate or refetch relevant queries after a successful log creation
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", data.booking._id] });
      toast.success("Booking Log create successfully")
      handleCloseModal();
    },
    onError: (error:APIErrorResponse) => {
      console.error("Error creating booking log:", error);
      toast.error(error.response.data.message || "Error creating class");
    },
  });
};
