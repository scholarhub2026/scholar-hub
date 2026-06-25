import MainLayout from "@/components/MainLayout";
import { contactNumber1, contactNumber2, email } from "@/data";

export default function ContactUs() {
  return (
    <MainLayout>
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Contact Us</h1>
      <p className="text-gray-600 mb-4">
        We’re here to help! Reach out to us through any of the methods below.
      </p>
      <div className="bg-white shadow-lg rounded-xl p-6 space-y-4 border">
        <p><span className="font-semibold">Email:</span> {email}</p>
        <p><span className="font-semibold">Phone:</span> {contactNumber1} | {contactNumber2}</p>

      </div>
    </div>
    </MainLayout>
  );
}
