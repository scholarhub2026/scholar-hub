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
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, MenuIcon } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/auth/AuthProvider";
import { roleBase, type RoleSlug } from "@/config/roles";

interface DashboardHeaderProps {
  userRole: RoleSlug;
  userName: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, userName }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  const base = roleBase(userRole);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out.",
    });
    navigate("/login");
  };

  return (
    <header className="border-b bg-white">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Mobile Sidebar Toggle */}
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar userRole={userRole} />
            </SheetContent>
          </Sheet>
        )}

        <h1 className="text-xl font-semibold">Dashboard</h1>

        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="relative mr-2">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="h-9 w-9 p-0 rounded-full">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                  {userName?.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="font-medium">{userName?.toUpperCase()}</div>
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
