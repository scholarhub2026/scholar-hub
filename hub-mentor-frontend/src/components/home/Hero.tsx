import { Button } from "@/components/ui/button";
import { handleOpenModal } from "@/contexts/modal-state";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  GraduationCap,
  MonitorSmartphone,
} from "lucide-react";

// Honest early-stage value props (no invented numbers).
const highlights = [
  { icon: BadgeCheck, label: "Every mentor vetted" },
  { icon: CalendarCheck, label: "Flexible scheduling" },
  { icon: MonitorSmartphone, label: "Online & offline sessions" },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* soft brand glow */}
      <div className="pointer-events-none absolute -top-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-brand-violet/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-brand-blue/10 blur-3xl" />

      <div className="container-wide relative py-16 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <div className="flex flex-col space-y-7 animate-fade-in">
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Expert{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                mentorship
              </span>{" "}
              for academic excellence
            </h1>

            <p className="max-w-xl text-lg text-slate-600 md:text-xl">
              Connect with verified mentors who are experts in their fields — from
              maths and science to languages and test prep. Personalized, one-on-one
              guidance built around your goals.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => handleOpenModal("form")}
                size="lg"
                className="h-12 gap-2 px-7 text-base shadow-lg shadow-primary/20"
              >
                Enquire now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleOpenModal("MentorForm")}
                variant="outline"
                size="lg"
                className="h-12 px-7 text-base"
              >
                Become a mentor
              </Button>
            </div>

            {/* value props */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              {highlights.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative lg:h-[540px]">
            <div className="relative h-[380px] overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 md:h-[480px] lg:h-full">
              <img
                src="/home.jpeg"
                alt="A mentor guiding a student"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-indigo/30 via-transparent to-transparent" />
            </div>

            {/* Floating card — personalized */}
            <div className="absolute -top-5 -right-3 max-w-[280px] rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-xl backdrop-blur md:top-8 md:right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <CalendarCheck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Personalized 1-on-1</div>
                  <p className="text-xs text-slate-500">Sessions built around you</p>
                </div>
              </div>
            </div>

            {/* Floating card — verified */}
            <div className="absolute -bottom-5 -left-3 max-w-[280px] rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-xl backdrop-blur md:bottom-8 md:left-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Verified experts</div>
                  <p className="text-xs text-slate-500">Every mentor is vetted</p>
                </div>
              </div>
            </div>

            {/* Floating card — affordable */}
            <div className="absolute bottom-16 -right-3 hidden max-w-[220px] rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    From ₹150/hr
                  </div>
                  <p className="text-xs text-slate-500">Affordable sessions</p>
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
