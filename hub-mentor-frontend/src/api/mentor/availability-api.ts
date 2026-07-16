import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type WeeklySlot = {
  _id?: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number; // 1 = 1-on-1, >1 = group
  isActive: boolean;
};

export type AvailabilityInput = {
  weekly_availability?: WeeklySlot[];
  is_available?: boolean;
};

// Enriched slot returned by GET /mentor/:id/availability.
export type AvailabilitySlotView = WeeklySlot & {
  recurringRemaining: number;
  dateHolds: Record<string, number>; // "YYYY-MM-DD" -> single-session holds
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
      qc.invalidateQueries({ queryKey: ["mentor-availability", { id: vars.id }] });
      toast.success("Availability updated");
    },
    onError: (e) => toast.error(errMessage(e, "Failed to update availability")),
  });
};

// GET /api/mentor/:id/availability — bookable slots + remaining seats.
export const useGetAvailabilityQuery = (id?: string) =>
  useQuery({
    queryKey: ["mentor-availability", { id }],
    enabled: !!id,
    queryFn: async () =>
      (await axiosInstance.get(`/mentor/${id}/availability`)).data as {
        is_available: boolean;
        slots: AvailabilitySlotView[];
      },
  });
