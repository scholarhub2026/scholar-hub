import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { handleOpenModal } from "@/contexts/modal-state";

const Hero = () => {
  const handleBookAppointment = () => {
    handleOpenModal("form");
  };

  return (
    <section className="relative bg-white">
      <div className="container-wide py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-6 animate-fade-in">
            <div className="inline-block">
              <div className="inline-flex items-center rounded-full px-4 py-1 text-sm bg-mentor-light text-mentor-secondary">
                <span className="font-medium">
                  New: Group Sessions Available!
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Expert <span className="text-primary">Mentorship</span> for
              Academic Excellence
            </h1>
            <p className="max-w-xl text-lg md:text-xl text-muted-foreground">
              Connect with verified mentors who are experts in their fields.
              From math and science to languages and test prep, find the perfect
              mentor for your academic journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* <Link to="/mentors"> */}
              <Button
                onClick={handleBookAppointment}
                size="lg"
                className="h-12 px-8"
              >
                Enquiry Now
              </Button>
              {/* </Link> */}

              <Button
                onClick={() => handleOpenModal("MentorForm")}
                variant="outline"
                size="lg"
                className="h-12 px-8"
              >
                Become a Mentor
              </Button>
            </div>
            {/* <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full border-2 border-white bg-mentor-primary`}
                  >
                    <span className="sr-only">User {i}</span>
                  </div>
                ))}
              </div>
              <div>
                <span className="font-semibold">500+</span> mentors have joined
                in the last month
              </div>
            </div> */}
          </div>
          <div className="relative lg:h-[540px]">
            <div className="relative h-[400px] md:h-[500px] lg:h-full overflow-hidden rounded-xl">
              <img
                src="/home.jpeg"
                alt="Student getting mentored"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-mentor-secondary/20 to-transparent" />
            </div>

            {/* Floating Cards */}
            <div className="absolute -bottom-6 -left-6 md:bottom-10 md:left-10 max-w-[300px] bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-mentor-light flex items-center justify-center">
                 
                </div>
                <div>
                  <h3 className="font-semibold">Personal online classes for overseas students</h3>
                  {/* <p className="text-sm text-muted-foreground">
                    Students improve their grades
                  </p> */}
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 md:top-10 md:right-10 max-w-[300px] bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-mentor-light flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path
                      stroke="#000"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 4h4.5m0 0a4.5 4.5 0 1 1 0 9H6l7 7M10.5 4H18M6 8.5h12"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Affordable Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Starting at just ₹150/hour
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
