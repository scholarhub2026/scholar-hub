import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const fetchBookings = async ({ queryKey }) => {
  const [_key, { studentId, page = 1, limit = 10, search = "" }] = queryKey;
  const { data } = await axiosInstance.get(`/booking/${studentId}`, {
    params: { page, limit, search },
  });
  return data;
};

export const useBookingsQuery = ({ studentId, page = 1, limit = 10, search = "" }) => {
  return useQuery({
    queryKey: ["bookings", { studentId, page, limit, search }],
    queryFn: fetchBookings,
    
    enabled: !!studentId, // runs only when studentId exists
  });
};
