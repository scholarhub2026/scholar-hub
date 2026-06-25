import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import { store } from '@/contexts/store';
import { snapshot } from 'valtio';

interface DashboardHeaderProps {
  userRole: 'student' | 'parent' | 'mentor' | 'admin';
  userName: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, userName }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const finalUserRole = userRole || store.getUserRole();
   const snap = snapshot(store);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    toast({
      title: 'Logged out successfully',
      description: 'You have been logged out.',
    });

    navigate('/login');
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
              <Sidebar userRole={finalUserRole} />
            </SheetContent>
          </Sheet>
        )}

        {/* Title */}
        <h1 className="text-xl font-semibold">Dashboard</h1>

        {/* Right Section */}
        <div className="flex items-center">

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>

          {/* Profile Dropdown */}
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

              <DropdownMenuItem asChild>
                <Link to={`/dashboard/profile/${snap.loggedUser?.id}`}>Profile</Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>

              {finalUserRole === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/admin-settings">Admin Controls</Link>
                </DropdownMenuItem>
              )}

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
