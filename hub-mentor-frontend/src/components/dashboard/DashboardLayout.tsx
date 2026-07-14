import React from "react";
import type { RoleSlug } from "@/config/roles";

/**
 * DEPRECATED as a real shell. The persistent shell is now <DashboardShell>
 * (a route-layout element — see App.tsx), which stays mounted across navigation.
 *
 * Pages still wrap their content in <DashboardLayout> for backwards-compat, so
 * this now just passes children through — it must NOT render the sidebar/header
 * again (that's what caused the re-mount flicker on every menu click).
 */
interface DashboardLayoutProps {
  userRole?: RoleSlug;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => <>{children}</>;

export default DashboardLayout;
