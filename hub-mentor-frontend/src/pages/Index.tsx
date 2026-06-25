
import React from 'react';
import MainLayout from '@/components/MainLayout';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Subjects from '@/components/home/Subjects';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';

const Index = () => {
  return (
    <MainLayout>
      <Hero />
      <Features />
      <HowItWorks />
      <Subjects />
      {/* <Testimonials /> */}
      <CTA />
    </MainLayout>
  );
};

export default Index;
