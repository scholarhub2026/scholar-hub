import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// Fetch classes with optional pagination and classId
const fetchClasses = async ({
  queryKey,
}: {
  queryKey: [string, { classId?: string; page?: number; limit?: number }];
}) => {
  const [, { classId, page = 1, limit = 10 }] = queryKey;

  const endpoint = classId
    ? `/classes/${classId}`
    : `/classes?page=${page}&limit=${limit}`;

  const response = await axiosInstance.get(endpoint);

  if (!response || !response.data) {
    throw new Error("Failed to fetch classes");
  }

  return response.data;
};


export const useGetClassesQuery = ({
  classId,
  page = 1,
  limit = 10,
}: {
  classId?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["classes", { classId, page, limit }],
    queryFn: fetchClasses,
    enabled: !!classId || classId === undefined, // allow fetch if classId is provided or not required
    refetchOnWindowFocus: false,
    
  });
};
