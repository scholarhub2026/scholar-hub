import React from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";


import { useSnapshot } from "valtio";
import { store } from "@/contexts/store";

interface DashboardLayoutProps {
  userRole?: "student" | "mentor" | "admin"; // made optional
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userRole,
  children,
}) => {
 
  const finalUserRole = userRole || store.getUserRole();

  const loggedUser = store.getLoggedUser();



  return (
    <div className="flex h-screen">
      <div className="w-64 hidden md:block">
        <Sidebar userRole={finalUserRole} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          userRole={finalUserRole}
          userName={loggedUser.firstName}
        />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
