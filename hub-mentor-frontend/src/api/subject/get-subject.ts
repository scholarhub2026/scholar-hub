import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

// Fetch function supporting subjectType + pagination
const fetchSubjects = async ({
  queryKey,
}: {
  queryKey: [string, { subjectType: string; page?: number; limit?: number }];
}) => {
  const [, { subjectType, page = 1, limit = 10 }] = queryKey;

  if (!subjectType) {
    throw new Error("Subject type is required");
  }

  const response = await axiosInstance.get(
    `/subject/${subjectType}?page=${page}&limit=${limit}`
  );

  if (!response) {
    throw new Error("Failed to fetch subjects");
  }
 
  
  
  
  return response?.data;
};

// Custom hook with pagination
export const useGetSubjectQuery = ({
  subjectType,
  page = 1,
  limit = 10,
}: {
  subjectType: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["subject", { subjectType, page, limit }],
    queryFn: fetchSubjects,
    refetchOnWindowFocus: false,
  });
};
