import React from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC = () => {
  const loadRazorpay = (src: string) => {
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const makePayment = async () => {
    const res = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: "rzp_test_RNsg28RlXtLY7i", // Replace with your Razorpay key_id
      amount: 50000, // amount in paisa (50000 = ₹500)
      currency: "INR",
      name: "Scholar Hub",
      description: "Test Transaction",
      handler: function (response: any) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
      },
      prefill: {
        name: "Shahanas",
        email: "customer@example.com",
        contact: "+919633892190",
      },
      theme: {
        color: "#3399cc",
      },
       method: {
    upi: true,    // enable UPI
    card: true,  // disable Card
    netbanking: false,
    wallet: false,
    
  },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <button
        onClick={makePayment}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
      >
        Make Payment
      </button>
    </div>
  );
};

export default RazorpayPayment;
