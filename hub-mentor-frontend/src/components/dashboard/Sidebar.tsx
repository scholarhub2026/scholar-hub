import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { RoleSlug } from "@/config/roles";
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
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  userRole: RoleSlug;
}

type NavItem = { name: string; href: string; icon: LucideIcon };

// Only routes that actually resolve today. Mentor/Student portals grow in
// Phases 2–3 (earnings, availability, my-bookings, messages, …).
const NAVIGATION: Record<RoleSlug, NavItem[]> = {
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
  const items = NAVIGATION[userRole] ?? NAVIGATION.student;

  const isActive = (href: string) => {
    if (ROOTS.includes(href)) return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-white border-r">
      <Link to="/" className="flex items-center gap-2 border-b p-4">
        <Logo className="h-9" />
        <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
          Scholar<span className="text-primary">Hub</span>
        </span>
      </Link>
      <div className="p-4">
        <nav className="flex flex-col space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive(item.href)
                    ? "bg-mentor-light text-primary"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
