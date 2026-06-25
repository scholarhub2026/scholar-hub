
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    title: 'Find Your Ideal Mentor',
    description:
      'Browse our extensive network of verified mentors, filter by subject, expertise, and availability to find your perfect match.',
  },
  {
    number: '02',
    title: 'Schedule a Session',
    description:
      'Book a one-on-one or group session with your chosen mentor at a time that works for you using our calendar system.',
  },
  {
    number: '03',
    title: 'Connect and Learn',
    description:
      'Meet with your mentor via our platform for personalized guidance, homework help, or exam preparation.',
  },
  {
    number: '04',
    title: 'Track Your Progress',
    description:
      'Review session notes, complete assignments, and monitor your improvement through our dashboard.',
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-mentor-light py-16 md:py-24">
      <div className="container-wide">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            How Scholar Hub Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with Scholar Hub is easy. Our platform is designed to connect you with the right mentor in just a few simple steps.
          </p>
        </div>
        
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-mentor-primary/20 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm relative z-10"
              >
                <div className="h-12 w-12 rounded-full bg-mentor-primary flex items-center justify-center text-white font-bold mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/about">
            <Button variant="outline" className="text-base">
              Learn More About Our Process
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
