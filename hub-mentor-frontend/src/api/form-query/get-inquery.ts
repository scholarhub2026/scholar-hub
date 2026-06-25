import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// Supports both: single inquiry (by ID) and paginated list (with page, limit)
const fetchInquery = async ({
  queryKey,
}: {
  queryKey: [string, { id?: string; page?: number; limit?: number }];
}) => {
  const [, { id, page = 1, limit = 10 }] = queryKey;

  const endpoint = id
    ? `/inquery-form/${id}`
    : `/inquery-form?page=${page}&limit=${limit}`;

  const response = await axiosInstance.get(endpoint);
  return response.data;
};

// Hook
export const useGetInqueryQuery = ({
  id,
  page = 1,
  limit = 10,
}: {
  id?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["inquery", { id, page, limit }],
    queryFn: fetchInquery,
   
    refetchOnWindowFocus: false,
  });
};
