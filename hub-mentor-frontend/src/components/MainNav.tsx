import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/components/brand/Logo";

const routes = [
  { href: "/", label: "nav.home" },
  { href: "/mentors", label: "nav.mentors" },
  { href: "/about", label: "nav.about" },
];

const MainNav = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-10" />
          <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
            Scholar<span className="text-primary">Hub</span>
          </span>
        </Link>

        {isMobile ? (
          <MobileNav />
        ) : (
          <div className="flex items-center gap-1">
            <nav className="flex items-center">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  to={route.href}
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors",
                    "hover:text-primary hover:bg-primary/5",
                  )}
                >
                  {route.label.startsWith("nav.") ? t(route.label) : route.label}
                </Link>
              ))}
            </nav>
            <div className="ml-3 flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-700">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="shadow-sm shadow-primary/20">{t("nav.signup")}</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const MobileNav = () => {
  const { t } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col gap-6 pt-8">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9" />
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
              Scholar<span className="text-primary">Hub</span>
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                className="rounded-md px-3 py-2 text-base font-medium text-slate-700 transition hover:bg-primary/5 hover:text-primary"
              >
                {route.label.startsWith("nav.") ? t(route.label) : route.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex flex-col gap-2">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                {t("nav.login")}
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full">{t("nav.signup")}</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MainNav;
