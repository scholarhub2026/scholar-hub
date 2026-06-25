import MainLayout from "@/components/MainLayout";
import { email } from "@/data";

export default function CookiePolicy() {
  return (
    <MainLayout>
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-2xl mt-8 mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Cookie Policy</h1>

      <p className="mb-4">
        This Cookie Policy explains how <strong>Scholarhub</strong>  uses cookies and similar technologies on our website.
      </p>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">What are cookies?</h2>
      <p className="text-gray-700">
        Cookies are small text files placed on your device to store information. They help provide a better 
        browsing experience.
      </p>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">Types of Cookies We Use</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li><strong>Essential Cookies:</strong> Required for site functionality.</li>
        <li><strong>Analytics Cookies:</strong> Help us understand site usage and performance.</li>
        <li><strong>Functional Cookies:</strong> Remember your preferences (e.g., language).</li>
        <li><strong>Marketing Cookies:</strong> Used for ads and campaign measurement (if applicable).</li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">Managing Cookies</h2>
      <p className="text-gray-700">
        You can disable cookies through your browser settings. However, some features may not work properly 
        if cookies are disabled.
      </p>

      <h2 className="text-lg font-semibold text-gray-800 mt-6">Contact Us</h2>
      <p className="text-gray-700">
        Email: <a href={`mailto:${email}`} className="text-blue-600 underline">{email}</a><br />
        Website: <a href="https://scholarhub.live" className="text-blue-600 underline">https://scholarhub.live</a>
      </p>
    </div>
    </MainLayout>
  );
}
