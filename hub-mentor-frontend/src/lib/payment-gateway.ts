const loadRazorpay = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;



export const makePayment = async (data) => {
  const res = await loadRazorpay(
    "https://checkout.razorpay.com/v1/checkout.js"
  );

  if (!res) {
    alert("Razorpay SDK failed to load. Are you online?");
    return;
  }

  // Normally you create an order from backend and get order_id
  // For demo purpose, using test key directly
  const options = {
    key: RAZORPAY_KEY_ID, // Replace with your Razorpay key_id
    amount: data.totalAmount * 100, // amount in paisa (50000 = ₹500)
    currency: "INR",
    name: "Scholar Hub",
    description: data?.orderId,
    image: "https://www.scholarhub.live/og-image.png",
    handler: async function (response) {
      alert("Payment successful! Payment ID: " + response.razorpay_payment_id);

      // You can send this response to backend to verify payment
    },
    prefill: {
      name: data.studentName,
      email: data.email,
      contact: data.phone,
    },

    notes: {
      address: "Customer Address",
    },
    theme: {
      color: "#3399cc",
    },
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
};
