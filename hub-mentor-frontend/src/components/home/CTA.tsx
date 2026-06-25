
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container-wide">
        <div className="bg-gradient-to-r from-mentor-secondary to-mentor-primary rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-24 sm:px-12 md:py-32 md:px-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Academic Journey?
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              Join thousands of students who are achieving their academic goals with personalized mentorship from experts in their field.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/mentors">
                <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-white/90">
                  Find a Mentor Today
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-white/90">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
