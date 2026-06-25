import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface PaymentLinkInput {
  amount: number;
  name: string;
  email: string;
  contact: string;
  orderId?: string;
}



const createPaymentLink = async (data: PaymentLinkInput) => {
  const response = await axiosInstance.post("/booking/create-payment-link", data);
  return response.data;
};


export const useCreatePaymentLinkMutation = () => {
  return useMutation({
    mutationFn: createPaymentLink,

    onSuccess: async (data) => {
      console.log("Payment link created successfully:", data);
      toast.success("Payment link created successfully");

       const paymentUrl = data?.paymentLink?.short_url || "";
      if (paymentUrl) {
        try {
          await navigator.clipboard.writeText(paymentUrl);
          toast.success("Payment link copied to clipboard!");
        } catch (err) {
          console.error("Failed to copy payment link:", err);
          toast.error("Failed to copy payment link");
        }
      }
   
    },
    onError: (error) => {
      console.error("Error creating payment link:", error);
        toast.error("Failed to create payment link");
    }
  });
};
