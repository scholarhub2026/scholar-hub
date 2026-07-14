import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, MenuIcon } from "lucide-react";
import Sidebar, { NAVIGATION } from "./Sidebar";
import { useAuth } from "@/auth/AuthProvider";
import { roleBase, type RoleSlug } from "@/config/roles";

interface DashboardHeaderProps {
  userRole: RoleSlug;
  userName: string;
}

const ROLE_LABEL: Record<RoleSlug, string> = {
  admin: "Administrator",
  mentor: "Mentor",
  student: "Student",
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  const base = roleBase(userRole);

  // Page title from the nav config (longest matching href wins).
  const title =
    [...(NAVIGATION[userRole] ?? [])]
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (item) =>
          location.pathname === item.href ||
          location.pathname.startsWith(`${item.href}/`),
      )?.name ?? "Dashboard";

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out.",
    });
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile Sidebar Toggle */}
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar userRole={userRole} />
              </SheetContent>
            </Sheet>
          )}

          <h1 className="font-display text-lg font-bold text-slate-900">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="relative text-slate-500">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-orange" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full p-1 pr-2 transition hover:bg-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                  {userName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden text-left md:block">
                  <div className="text-sm font-semibold capitalize leading-tight text-slate-800">
                    {userName || "User"}
                  </div>
                  <div className="text-[11px] leading-tight text-slate-400">
                    {ROLE_LABEL[userRole]}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="truncate font-medium">{user?.email || userName}</div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {user?.id && (
                <DropdownMenuItem asChild>
                  <Link to={`${base}/profile/${user.id}`}>Profile</Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <Link to={`${base}/settings`}>Settings</Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
