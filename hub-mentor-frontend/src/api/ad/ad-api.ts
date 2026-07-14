import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Ad = {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdInput = {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive?: boolean;
  order?: number;
};

const ADS_KEY = ["ads", "all"] as const;

// GET /api/ads/all — admin, includes inactive banners.
export const useGetAllAdsQuery = () =>
  useQuery<Ad[]>({
    queryKey: ADS_KEY,
    queryFn: async () => (await axiosInstance.get("/ads/all")).data?.data ?? [],
    refetchOnWindowFocus: false,
  });

// GET /api/ads — public, active banners for the home carousel.
export const useActiveAdsQuery = () =>
  useQuery<Ad[]>({
    queryKey: ["ads", "active"],
    queryFn: async () => (await axiosInstance.get("/ads")).data?.data ?? [],
    refetchOnWindowFocus: false,
  });

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

export const useCreateAdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdInput) => (await axiosInstance.post("/ads", input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADS_KEY });
      toast.success("Ad created");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to create ad")),
  });
};

export const useUpdateAdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdInput> }) =>
      (await axiosInstance.put(`/ads/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADS_KEY });
    },
    onError: (e) => toast.error(errMessage(e, "Failed to update ad")),
  });
};

export const useDeleteAdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await axiosInstance.delete(`/ads/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADS_KEY });
      toast.success("Ad deleted");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to delete ad")),
  });
};
