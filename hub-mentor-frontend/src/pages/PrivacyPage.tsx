import MainLayout from "@/components/MainLayout";
import { contactNumber1, email } from "@/data";

export default function PrivacyPolicy() {
  return (
    <MainLayout>
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-2xl mt-8 mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
      {/* <p className="text-sm text-gray-500 mb-6">Last updated: YYYY-MM-DD</p> */}

      <p className="mb-4">
        At <strong>Scholarhub</strong>  your privacy is important to us. 
        This Privacy Policy explains how we collect, use, disclose, and protect your personal information 
        when you use our website and services.
      </p>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">Information We Collect</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>
          <strong>Personal Information:</strong> Name, email address, phone number, billing/shipping 
          address when you provide it.
        </li>
        <li>
          <strong>Payment Information:</strong> Payments are processed by third-party providers 
          (e.g., Razorpay). We do not store full payment card details.
        </li>
        <li>
          <strong>Technical Data:</strong> IP address, browser type, device info, and pages visited.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">How We Use Your Information</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>To provide and improve our services.</li>
        <li>To process orders and payments securely.</li>
        <li>To communicate updates, offers, and support.</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">Third-Party Services</h2>
      <p className="text-gray-700">
        We may share information with third-party service providers such as payment processors 
        (Razorpay). Please review their privacy policy for details.
      </p>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">Contact Us</h2>
      <p className="text-gray-700">
        Email: <a href={`mailto:${email}`} className="text-blue-600 underline">
          {email}</a><br />
        Phone: <a href={`tel:${contactNumber1}`} className="text-blue-600 underline">{contactNumber1}</a>
      </p>

      <p className="text-gray-500 text-sm mt-6">
        © {new Date().getFullYear()} Scholarhub. All rights reserved.
      </p>
    </div>
    </MainLayout>
  );
}
