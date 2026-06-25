import axiosInstance from "@/lib/axios"
import { useQuery } from "@tanstack/react-query";

 const verifyTokenFn = async () => {
  const res = await axiosInstance.get("/auth/verify-token");
  return res.data; // adjust if your API returns a different shape
};

export const useVerifyTokenQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ["verify-token"],
    queryFn: verifyTokenFn,
    enabled, // only runs if true (you can control this based on localStorage)
    retry: false, // avoid retrying on unauthorized
    staleTime: 0, // force refetch every time if needed
  });
};