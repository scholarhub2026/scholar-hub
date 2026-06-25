import MainLayout from "@/components/MainLayout";
import { contactNumber1, contactNumber2, email } from "@/data";

export default function ShippingPolicy() {
  return (
    <MainLayout>
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Service Delivery Policy</h1>
      <div className="bg-white shadow-lg rounded-xl p-6 space-y-4 border">
        <p>
          At <span className="font-semibold">Scholar Hub</span>, we provide tutoring 
          services online. As our services are not physical goods, shipping does not apply.
        </p>
        <p>
          Once a student successfully enrolls and completes the payment, our team will confirm 
          the schedule and provide access to the tutoring sessions within 
          <span className="font-semibold"> 24–48 hours</span>.
        </p>
        <p>
          For questions regarding service delivery, please contact us at 
          <span className="font-semibold"> {email}</span> or call 
          <span className="font-semibold"> {contactNumber1} | {contactNumber2}</span>.
        </p>
      </div>
    </div>
    </MainLayout>
  );
}
