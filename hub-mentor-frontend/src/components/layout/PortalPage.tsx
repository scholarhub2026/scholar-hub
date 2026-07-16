import React from "react";
import MainLayout from "@/components/MainLayout";
import { usePortalBase } from "@/hooks/usePortalBase";

/**
 * Wraps a page that's reachable both publicly and from inside the dashboard
 * shell. On public routes it renders the marketing chrome (MainLayout: nav +
 * footer); inside `/app/…` the DashboardShell already provides the chrome, so
 * the content renders bare.
 */
const PortalPage = ({ children }: { children: React.ReactNode }) => {
  const base = usePortalBase();
  return base ? <>{children}</> : <MainLayout>{children}</MainLayout>;
};

export default PortalPage;
