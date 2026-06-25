import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// API call
const getBookingLogs = async (bookingId) => {
  const response = await axiosInstance.get(`/bookingLog/${bookingId}`);
  return response.data.bookingLogs;
};

// Hook
export const useBookingLogsQuery = (bookingId) => {
  return useQuery({
    queryKey: ["bookingLogs", bookingId],
    queryFn: () => getBookingLogs(bookingId),
    enabled: !!bookingId, // only run when bookingId is available
  });
};
