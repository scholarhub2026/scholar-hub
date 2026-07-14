
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const subjects = [
  {
    name: 'Mathematics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-700',
  },
  {
    name: 'Science',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M10 2v7.31" />
        <path d="M14 9.3V2" />
        <path d="M8.5 2h7" />
        <path d="M14 22v-5" />
        <path d="M10 22v-5" />
        <path d="M13.9 17H10" />
        <path d="M18 10v9c0 .55-.47.98-1 .98h0c-.53 0-1-.43-1-.98v-6.95" />
        <path d="M8 10v9c0 .55-.47.98-1 .98h0c-.53 0-1-.43-1-.98v-6.95" />
        <path d="M10 4.3C6.53 4.3 3.3 7.6 3.3 12s3.23 7.7 6.7 7.7" />
        <path d="M14 4.3c3.47 0 6.7 3.3 6.7 7.7s-3.23 7.7-6.7 7.7" />
      </svg>
    ),
    color: 'bg-green-50 text-green-700',
  },
  {
    name: 'Language Arts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
    color: 'bg-purple-50 text-purple-700',
  },
  {
    name: 'Social Studies',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-700',
  },
  {
    name: 'Foreign Languages',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M2 5h20" />
        <path d="M2 10h20" />
        <path d="M2 15h10" />
        <path d="M2 20h5" />
      </svg>
    ),
    color: 'bg-rose-50 text-rose-700',
  },
  {
    name: 'Test Preparation',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M13 2v7h7" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="16" y2="16" />
      </svg>
    ),
    color: 'bg-orange-50 text-orange-700',
  },
  {
    name: 'Music',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="8" cy="18" r="4" />
        <path d="M12 18V2l7 4" />
      </svg>
    ),
    color: 'bg-indigo-50 text-indigo-700',
  },
  {
    name: 'Computer Science',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M9 21H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-1" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    ),
    color: 'bg-cyan-50 text-cyan-700',
  },
];

const Subjects = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-wide">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            Subjects
          </p>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Explore popular subjects
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Our mentors specialize across a wide range of academic subjects to help
            you succeed in any area.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {subjects.map((subject, index) => (
            <Link
              key={index}
              to={`/mentors?subject=${subject.name}`}
              className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                className={cn(
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-105",
                  subject.color,
                )}
              >
                {subject.icon}
              </div>
              <h3 className="font-semibold text-slate-800">{subject.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Subjects;
