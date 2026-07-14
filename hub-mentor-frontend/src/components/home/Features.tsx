import {
  Target,
  ShieldCheck,
  CalendarDays,
  MessagesSquare,
  Users,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type Feature = { icon: LucideIcon; title: string; description: string };

const features: Feature[] = [
  {
    icon: Target,
    title: "Personalized learning",
    description:
      "Mentors build a custom plan around your learning style, pace, and academic goals.",
  },
  {
    icon: ShieldCheck,
    title: "Verified experts",
    description:
      "Every mentor passes a rigorous verification process, so you learn from qualified pros.",
  },
  {
    icon: CalendarDays,
    title: "Flexible scheduling",
    description:
      "Book sessions when it suits you with an easy, conflict-free calendar.",
  },
  {
    icon: MessagesSquare,
    title: "Real-time feedback",
    description:
      "Get guidance during sessions and detailed follow-ups to keep improving.",
  },
  {
    icon: Users,
    title: "Group sessions",
    description:
      "Learn collaboratively in small groups that foster peer learning at a lower cost.",
  },
  {
    icon: TrendingUp,
    title: "Progress tracking",
    description:
      "Set goals and watch your improvement through an intuitive dashboard.",
  },
];

const Features = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-wide">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            Why Scholar Hub
          </p>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            A better way to learn and grow
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything you need to excel academically — expert guidance, structure,
            and the tools to stay on track.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-primary/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
