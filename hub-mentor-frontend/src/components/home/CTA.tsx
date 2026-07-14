import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container-wide">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient shadow-2xl shadow-primary/20">
          {/* decorative glows */}
          <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative px-6 py-20 text-center sm:px-12 md:py-24 md:px-16">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Ready to transform your academic journey?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">
              Achieve your goals with personalized mentorship from experts in
              their field — online or in person.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/mentors">
                <Button
                  size="lg"
                  className="h-12 gap-2 bg-white px-8 text-base text-primary hover:bg-white/90"
                >
                  Find a mentor today
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  Learn more
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
