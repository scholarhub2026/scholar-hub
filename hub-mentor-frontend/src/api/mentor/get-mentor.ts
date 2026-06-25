import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// Supports both: single mentor by ID or paginated list
const fetchMentorFn = async ({
  queryKey,
}: {
  queryKey: [string, { id?: string; page?: number; limit?: number; type?: string }];
}) => {
  const [, { id, page = 1, limit = 10, type }] = queryKey;

  const endpoint = id
    ? `/mentor?id=${id}`
    : `/mentor?page=${page}&limit=${limit}${type ? `&type=${type}` : ""}`;

  const response = await axiosInstance.get(endpoint);
  return response.data;
};

// Hook
export const useGetMentorQuery = ({
  id,
  page = 1,
  limit = 10,
  type
}: {
  id?: string;
  page?: number;
  limit?: number;
  type?: string;
}) => {
  return useQuery({
    queryKey: ["mentor", { id, page, limit, type }],
    queryFn: fetchMentorFn,
    enabled: !!id || page > 0, // only run if id exists or pagination is valid
    refetchOnWindowFocus: false,
  });
};
