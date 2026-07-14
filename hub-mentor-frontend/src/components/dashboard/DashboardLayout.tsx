import React from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import { useAuth } from "@/auth/AuthProvider";
import { roleSlug, type RoleSlug } from "@/config/roles";

interface DashboardLayoutProps {
  /** Optional override; defaults to the authenticated user's role. */
  userRole?: RoleSlug;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userRole, children }) => {
  const { user } = useAuth();
  const finalUserRole: RoleSlug = userRole ?? roleSlug(user?.role);

  return (
    <div className="flex h-screen">
      <div className="w-64 hidden md:block">
        <Sidebar userRole={finalUserRole} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole={finalUserRole} userName={user?.firstName ?? ""} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
