import { contactNumber1, contactNumber2, email } from "@/data";

export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Cancellation and Refund Policy</h1>
      <div className="bg-white shadow-lg rounded-xl p-6 space-y-6 border">
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Cancellations</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Classes can be canceled up to <strong>24 hours in advance</strong> without charges.</li>
            <li>Cancellations within 24 hours of the session are not refundable.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Refunds</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Eligible refunds are processed to the original payment method.</li>
            <li>Refunds may take <strong>7–10 business days</strong> to reflect in your account.</li>
            <li>No refunds will be issued once a session has been conducted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Rescheduling</h2>
          <p className="text-gray-600">
            Students are encouraged to reschedule instead of canceling. Rescheduling requests 
            must be made at least 24 hours before the class.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Contact Us</h2>
          <p className="text-gray-600">
            For refund or cancellation-related queries, contact us at 
            <span className="font-semibold"> {email}</span> or call 
            <span className="font-semibold"> {contactNumber1}, {contactNumber2}</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
