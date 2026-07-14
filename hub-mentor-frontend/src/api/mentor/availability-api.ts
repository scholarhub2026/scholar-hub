import axiosInstance from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TimeSlot = { time: string };

export type AvailabilityInput = {
  available_slot?: TimeSlot[];
  is_available?: boolean;
};

const errMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  fallback;

// PUT /api/mentor/:id/availability
export const useUpdateAvailabilityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AvailabilityInput }) =>
      (await axiosInstance.put(`/mentor/${id}/availability`, data)).data,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["mentor", { id: vars.id }] });
      toast.success("Availability updated");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to update availability")),
  });
};
