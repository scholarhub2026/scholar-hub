import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export type RateCard = {
  source: "custom" | "default";
  perClassFee: number | null;
  subjectRates: Array<{
    subjectId: string | null;
    name: string;
    hourlyRate: number;
  }>;
};

export type BookingQuote = {
  rateCard: RateCard;
  estimatedAmount: number;
  estimateUnit: "per class" | "per hour";
  billingNote: string;
};

/**
 * Server-side pricing preview for the booking wizard (SRD billing engine).
 * The client never computes money — fees come from the resolved rate card
 * (mentor custom fees or global catalog defaults).
 */
export const useBookingQuoteQuery = (params: {
  mentorId?: string;
  classId?: string;
  bookingType?: string;
  selectedSubjects?: string[];
  enabled?: boolean;
}) =>
  useQuery<BookingQuote>({
    queryKey: [
      "booking-quote",
      params.mentorId,
      params.classId,
      params.bookingType,
      params.selectedSubjects,
    ],
    queryFn: async () =>
      (
        await axiosInstance.post(`/booking/quote`, {
          mentorId: params.mentorId,
          classId: params.classId,
          bookingType: params.bookingType,
          selectedSubjects: params.selectedSubjects ?? [],
        })
      ).data,
    enabled:
      (params.enabled ?? true) &&
      Boolean(
        params.mentorId &&
          params.classId &&
          params.bookingType &&
          (params.bookingType === "full" ||
            (params.selectedSubjects?.length ?? 0) > 0),
      ),
    retry: false,
    refetchOnWindowFocus: false,
  });
