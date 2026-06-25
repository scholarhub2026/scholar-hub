import axiosInstance from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// API call
const updateBookingLog = async ({ bookingId, logId, logData }) => {
  const response = await axiosInstance.put(`/booking/${bookingId}/log/${logId}`, logData);
  return response.data.bookingLogs;
};

// Hook
export const useUpdateBookingLogMutation = (bookingId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBookingLog,
    onSuccess: () => {
      // Refetch logs for the booking after update
      queryClient.invalidateQueries({ queryKey: ["bookingLogs", bookingId] });
    },
    onError: (error) => {
      console.error("Error updating booking log:", error);
    },
  });
};
