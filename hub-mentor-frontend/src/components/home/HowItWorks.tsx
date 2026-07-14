import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, CalendarCheck, Video, LineChart, type LucideIcon } from "lucide-react";

type Step = { number: string; icon: LucideIcon; title: string; description: string };

const steps: Step[] = [
  {
    number: "01",
    icon: Search,
    title: "Find your mentor",
    description:
      "Browse verified mentors and filter by subject, expertise, and availability to find your match.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Schedule a session",
    description:
      "Book a one-on-one or group session at a time that works for you with our calendar.",
  },
  {
    number: "03",
    icon: Video,
    title: "Connect and learn",
    description:
      "Meet your mentor for personalized guidance, homework help, or exam preparation.",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Track your progress",
    description:
      "Review session notes, complete assignments, and monitor improvement over time.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="container-wide">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Get started in four simple steps
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From finding the right mentor to tracking your growth — the whole journey
            is built to be effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
            >
              <span className="pointer-events-none absolute right-5 top-4 font-display text-5xl font-extrabold text-slate-100">
                {number}
              </span>
              <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="relative mb-2 text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="relative text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/about">
            <Button variant="outline" size="lg" className="text-base">
              Learn more about our process
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
