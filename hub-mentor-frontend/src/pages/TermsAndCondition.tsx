import MainLayout from '@/components/MainLayout';
import { contactNumber1, contactNumber2 } from '@/data';
import { ShieldCheck, UserCheck, BookCheck, AlertCircle } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-white via-blue-50 to-white text-gray-800 py-12 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center text-blue-900">Terms & Conditions</h1>

          {/* Tutors Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <UserCheck className="w-6 h-6" />
              <h2 className="text-2xl font-semibold">For Tutors</h2>
            </div>

            {[
              {
                title: "1. Eligibility",
                points: [
                  "Must be 18+ years old.",
                  "Provide accurate qualifications, ID proof, and experience.",
                  "No criminal record affecting student safety."
                ]
              },
              {
                title: "2. Registration",
                points: [
                  "Submit valid personal and academic details.",
                  "Scholar Hub may verify your credentials."
                ]
              },
              {
                title: "3. Conduct",
                points: [
                  "Maintain professionalism.",
                  "No discrimination, harassment, or abuse.",
                  "Don’t promote personal or third-party services."
                ]
              },
              {
                title: "4. Payment & Commission",
                points: [
                  "Payments are made on a daily, weekly, or monthly basis.",
                  "10% commission applies above ₹550/day or ₹5500/month.",
                  "Below that, ₹50/class or ₹500/month will be charged.",
                  "No direct payments allowed without Scholar Hub consent."
                ]
              },
              {
                title: "5. Cancellation Policy",
                points: [
                  "Notify at least 24 hours before cancellation/reschedule.",
                  "Frequent cancellations may lead to termination."
                ]
              },
              {
                title: "6. Confidentiality",
                points: [
                  "Respect student and parent privacy.",
                  "No misuse of customer information."
                ]
              },
              {
                title: "7. Termination",
                points: [
                  "Violation of terms or poor feedback may result in termination.",
                  "Bypassing Scholar Hub leads to a penalty equal to yearly commission loss."
                ]
              }
            ].map((section, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="text-lg font-semibold text-blue-800">{section.title}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4">
                  {section.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Customers Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
            <div className="flex items-center gap-2 mb-4 text-green-700">
              <BookCheck className="w-6 h-6" />
              <h2 className="text-2xl font-semibold">For Customers (Parents/Students)</h2>
            </div>

            {[
              {
                title: "1. Registration",
                points: [
                  "Provide accurate student and learning details.",
                  "Agree to tutor assignments by Scholar Hub."
                ]
              },
              {
                title: "2. Payment",
                points: [
                  "Fees must be paid in advance as per plan.",
                  "Only use official payment channels."
                ]
              },
              {
                title: "3. Safety & Conduct",
                points: [
                  "No inappropriate behavior towards tutors.",
                  "All complaints must go through Scholar Hub."
                ]
              },
              {
                title: "4. Class Rescheduling & Cancellation",
                points: [
                  "Cancel/reschedule at least 12 hours in advance.",
                  "Repeated no-shows may forfeit sessions."
                ]
              },
              {
                title: "5. Feedback & Reviews",
                points: [
                  "Constructive feedback is welcome.",
                  "Inappropriate reviews may be removed."
                ]
              },
              {
                title: "6. Refund Policy",
                points: [
                  "Refunds are only for verified tutor misconduct or non-service.",
                  "No refund for completed sessions."
                ]
              }
            ].map((section, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="text-lg font-semibold text-green-800">{section.title}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 pl-4">
                  {section.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* General Terms */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
            <div className="flex items-center gap-2 mb-4 text-gray-700">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-2xl font-semibold">General Terms</h2>
            </div>
            <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
              <li>Scholar Hub is a facilitator and is not responsible for external interactions.</li>
              <li>Bypassing Scholar Hub for direct tutoring is not allowed.</li>
              <li>Terms may be updated anytime; continued use implies acceptance.</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center text-sm text-gray-600">
            <AlertCircle className="mx-auto mb-2 text-gray-500" />
            <p><strong>Contact Us:</strong></p>
            <p>📞 {contactNumber1} | {contactNumber2}</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default TermsAndConditions;
