import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { roleSlug, type RoleSlug } from "@/config/roles";
import { useAuth } from "@/auth/AuthProvider";
import Logo from "@/components/brand/Logo";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  BookOpen,
  BarChart3,
  Settings,
  Search,
  CalendarClock,
  Megaphone,
  Star,
  Gift,
  UserCog,
  Wallet,
  Clock,
  UserRound,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  userRole: RoleSlug;
}

type NavItem = { name: string; href: string; icon: LucideIcon };

// Only routes that actually resolve today. Mentor/Student portals grow in
// later phases (messages, resources, …).
export const NAVIGATION: Record<RoleSlug, NavItem[]> = {
  admin: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Enquiries", href: "/admin/inquery", icon: Users },
    { name: "Mentors", href: "/admin/mentors", icon: Briefcase },
    { name: "Classes", href: "/admin/classes", icon: CalendarDays },
    { name: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { name: "Bookings", href: "/admin/bookings", icon: BarChart3 },
    { name: "Ads", href: "/admin/ads", icon: Megaphone },
    { name: "Reviews", href: "/admin/reviews", icon: Star },
    { name: "Referrals", href: "/admin/referrals", icon: Gift },
    { name: "Users", href: "/admin/users", icon: UserCog },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ],
  mentor: [
    { name: "Dashboard", href: "/mentor", icon: LayoutDashboard },
    { name: "My Profile", href: "/mentor/profile", icon: UserRound },
    { name: "Schedule", href: "/mentor/schedule", icon: CalendarClock },
    { name: "Earnings", href: "/mentor/earnings", icon: Wallet },
    { name: "Availability", href: "/mentor/availability", icon: Clock },
    { name: "Reviews", href: "/mentor/reviews", icon: Star },
    { name: "Settings", href: "/mentor/settings", icon: Settings },
  ],
  student: [
    { name: "Dashboard", href: "/app", icon: LayoutDashboard },
    { name: "Find Mentors", href: "/mentors", icon: Search },
    { name: "My Bookings", href: "/app/bookings", icon: BarChart3 },
    { name: "Rate Mentors", href: "/app/reviews", icon: Star },
    { name: "Refer & Earn", href: "/app/refer", icon: Gift },
    { name: "Settings", href: "/app/settings", icon: Settings },
  ],
};

const ROOTS = ["/admin", "/mentor", "/app"];

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Resolve dynamic hrefs (the profile route needs the user's id).
  const items = (NAVIGATION[userRole] ?? NAVIGATION.student).map((item) =>
    item.href === "/mentor/profile" && user?.id
      ? { ...item, href: `/mentor/profile/${user.id}` }
      : item,
  );

  const isActive = (href: string) => {
    if (ROOTS.includes(href)) return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-full min-h-screen flex-col border-r border-slate-200/80 bg-white">
      <Link to="/" className="flex items-center gap-2 border-b border-slate-100 p-4">
        <Logo className="h-9" />
        <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
          Scholar<span className="text-primary">Hub</span>
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-primary" : "text-slate-400 group-hover:text-slate-600",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-4">
        <p className="text-[11px] text-slate-400">Gateway to expert learning</p>
      </div>
    </div>
  );
};

export default Sidebar;
