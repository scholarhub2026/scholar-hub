const loadRazorpay = (src: string) => {
  return new Promise((resolve) => {
    // Avoid injecting the script twice.
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

type PaymentArgs = {
  totalAmount: number;
  orderId?: string | number;
  bookingId?: string;
  studentName?: string;
  email?: string;
  phone?: string;
  description?: string;
  onSuccess?: (response: { razorpay_payment_id: string }) => void;
  onDismiss?: () => void;
};

export const makePayment = async (data: PaymentArgs) => {
  const res = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
  if (!res) {
    alert("Razorpay SDK failed to load. Are you online?");
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(Number(data.totalAmount) * 100), // paise
    currency: "INR",
    name: "Scholar Hub",
    description: data.description || `Booking ${data.orderId ?? ""}`,
    image: "https://www.scholarhub.live/og-image.png",
    handler: (response: { razorpay_payment_id: string }) => {
      data.onSuccess?.(response);
    },
    modal: {
      ondismiss: () => data.onDismiss?.(),
    },
    prefill: {
      name: data.studentName,
      email: data.email,
      contact: data.phone,
    },
    // Lets the Razorpay webhook match the payment back to the booking.
    notes: { bookingId: data.bookingId ?? "" },
    theme: { color: "#2563EB" },
  };

  const paymentObject = new (window as any).Razorpay(options);
  paymentObject.open();
};
