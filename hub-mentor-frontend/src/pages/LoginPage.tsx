import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarCheck, GraduationCap } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignUpCard from "@/components/signup/singupCard";
import LoginCard from "@/components/signup/loginCard";
import Logo from "@/components/brand/Logo";

const points = [
  {
    icon: BadgeCheck,
    title: "Verified mentors",
    text: "Every mentor is vetted before they can teach.",
  },
  {
    icon: CalendarCheck,
    title: "Flexible sessions",
    text: "Book online or offline sessions on your schedule.",
  },
  {
    icon: GraduationCap,
    title: "Personalized guidance",
    text: "Learning plans built around your goals.",
  },
];

const LoginPage = ({ defaultType }: { defaultType: string }) => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <Link to="/" className="relative inline-flex w-fit items-center gap-2.5">
          <span className="flex items-center justify-center rounded-xl bg-white p-1.5">
            <Logo className="h-9" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            ScholarHub
          </span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white">
            Gateway to expert learning
          </h1>
          <p className="mt-4 text-lg text-white/85">
            Connect with expert mentors for personalized academic guidance —
            from school subjects to test prep.
          </p>

          <div className="mt-10 space-y-5">
            {points.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">{title}</div>
                  <p className="text-sm text-white/75">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} Scholar Hub
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex flex-col bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          {/* Mobile logo (brand panel hidden) */}
          <Link to="/" className="lg:hidden">
            <Logo className="h-9" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <Tabs defaultValue={defaultType} className="w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-200/70 p-1">
                <TabsTrigger value="login" className="rounded-lg text-sm font-semibold">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-sm font-semibold">
                  Create Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <LoginCard />
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <SignUpCard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
