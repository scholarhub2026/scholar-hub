
  export const loadRazorpay = (src) => {
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
  }

  const options = {
      key: "rzp_test_xxxxxxxx", // Replace with your Razorpay key_id
      amount: 50000, // amount in paisa (50000 = ₹500)
      currency: "INR",
      name: "HM2 Global",
      description: "Test Transaction",
      image: "https://your-logo-url.com/logo.png",
      handler: function (response) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
        // You can send this response to backend to verify payment
      },
      prefill: {
        name: "Shahanas",
        email: "customer@example.com",
        contact: "9876543210",
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
  }