import MainLayout from "@/components/MainLayout";
import { contactNumber1, contactNumber2, email } from "@/data";
import React from "react";

const AboutUs = () => {
  return (
    <MainLayout>
      <section className="bg-white text-gray-800 py-12 px-6 md:px-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            About Scholar Hub
          </h1>
          <p className="text-lg mb-6 font-medium text-gray-700">
            <span className="text-primary font-semibold">
              Empowering Young Minds, One Lesson at a Time
            </span>
            <br />
            Since 2025
          </p>

          <p className="mb-6 text-gray-600 leading-relaxed">
            At <strong>Scholar Hub</strong>, we believe that every child
            deserves personalized attention to unlock their full academic
            potential. Based in <strong>Kazhakuttom</strong>, we specialize in{" "}
            <strong>offline home tuition services</strong>, connecting
            qualified, passionate tutors with students across all grades and
            subjects.
          </p>

          <p className="mb-6 text-gray-600 leading-relaxed">
            Founded with a mission to bridge the gap between quality education
            and accessibility, Scholar Hub has quickly become a trusted name
            among parents and students seeking dependable, results-driven
            academic support.
          </p>

          <p className="mb-10 text-gray-600 leading-relaxed">
            Whether your child is building foundational skills in primary school
            or preparing for crucial board exams, our carefully vetted tutors
            ensure each session is effective, engaging, and tailored to their
            learning style and pace.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">
                What We Offer
              </h2>
              <ul className="list-disc list-inside space-y-3 text-gray-700">
                <li>
                  <strong>📚 One-on-One Home Tutoring:</strong> Personalized
                  sessions at home for convenience and focus.
                </li>
                <li>
                  <strong>🎓 Qualified Tutors:</strong> Verified professionals
                  trained in school syllabi and classroom management.
                </li>
                <li>
                  <strong>💡 Monthly Plans:</strong> Flexible, affordable
                  pricing tailored to academic needs and schedules.
                </li>
                <li>
                  <strong>📈 Student Progress Monitoring:</strong> Regular
                  feedback and updates to keep parents involved.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-primary mb-4">
                Our Vision & Mission
              </h2>
              <p className="mb-4 text-gray-700">
                <strong>Vision:</strong> To become Kerala’s leading home tuition
                service, fostering confidence, academic excellence, and a
                lifelong love for learning.
              </p>
              <p className="text-gray-700">
                <strong>Mission:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Deliver high-quality academic assistance right at your
                  doorstep.
                </li>
                <li>
                  Empower tutors with fair compensation and meaningful
                  opportunities.
                </li>
                <li>
                  Build a community of passionate, personalized, and progressive
                  learning.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-primary text-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">
              Join the Scholar Hub Community
            </h2>
            <p className="mb-4">
              Join hundreds of satisfied parents who trust Scholar Hub to shape
              their child’s academic future. Let’s build a brighter tomorrow—one
              student at a time.
            </p>
            <div className="space-y-1">
              <p>
                <strong>🌐 Website:</strong>{" "}
                <a href="https://www.scholarhub.live" className="underline">
                  www.scholarhub.live
                </a>
              </p>
              <p>
                <strong>📞 Call:</strong> 
                {contactNumber1} | {contactNumber2}
              </p>
              <p>
                <strong>📧 Email:</strong> {email}
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AboutUs;
