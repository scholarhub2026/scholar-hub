
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    content:
      "My daughter's math skills improved dramatically after just a few sessions. Her mentor not only helped with homework but also built her confidence.",
    author: 'Sarah Johnson',
    role: 'Parent of 8th Grader',
    image: 'https://i.pravatar.cc/150?img=32',
  },
  {
    content:
      "Scholar Hub helped me prepare for my SATs and I scored 200 points higher than on my practice tests. My mentor knew exactly what to focus on.",
    author: 'James Lee',
    role: 'High School Senior',
    image: 'https://i.pravatar.cc/150?img=59',
  },
  {
    content:
      "As a college student struggling with advanced physics, my mentor's guidance was invaluable. He explained complex concepts in ways that finally made sense to me.",
    author: 'Emily Rodriguez',
    role: 'College Sophomore',
    image: 'https://i.pravatar.cc/150?img=47',
  },
  {
    content:
      "Being a mentor on Scholar Hub has been incredibly rewarding. The platform makes it easy to connect with students and the scheduling system is seamless.",
    author: 'Dr. Michael Chen',
    role: 'Math Mentor, 4 years',
    image: 'https://i.pravatar.cc/150?img=51',
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-mentor-light">
      <div className="container-wide">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            What Our Community Says
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Hear from students, parents, and mentors who are part of the Scholar Hub community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <svg width="45" height="36" className="text-mentor-primary/40">
                      <path
                        d="M13.415.001C6.07 5.185.887 13.681.887 23.041c0 7.632 4.608 12.096 9.936 12.096 5.04 0 8.784-4.032 8.784-8.784 0-4.752-3.312-8.208-7.632-8.208-.864 0-2.016.144-2.304.288.72-4.896 5.328-10.656 9.936-13.536L13.415.001zm24.768 0c-7.2 5.184-12.384 13.68-12.384 23.04 0 7.632 4.608 12.096 9.936 12.096 4.896 0 8.784-4.032 8.784-8.784 0-4.752-3.456-8.208-7.776-8.208-.864 0-1.872.144-2.16.288.72-4.896 5.184-10.656 9.792-13.536L38.183.001z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <p className="text-lg mb-6 flex-grow">{testimonial.content}</p>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
