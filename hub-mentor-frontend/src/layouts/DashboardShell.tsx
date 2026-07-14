import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/auth/AuthProvider";
import { roleSlug, type RoleSlug } from "@/config/roles";

const ContentLoader = () => (
  <div className="flex h-full items-center justify-center">
    <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
  </div>
);

/**
 * Persistent role shell. Rendered once as a route-layout element, it stays
 * mounted across sibling routes — only <Outlet/> (the page content) swaps on
 * navigation, so the sidebar/header never re-mount (no flicker/"jerk").
 */
const DashboardShell = ({ role }: { role?: RoleSlug }) => {
  const { user } = useAuth();
  const finalRole: RoleSlug = role ?? roleSlug(user?.role);

  return (
    <div className="flex h-screen">
      <div className="w-64 hidden md:block">
        <Sidebar userRole={finalRole} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole={finalRole} userName={user?.firstName ?? ""} />
        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
          {/* Only the content area suspends while a page chunk loads — the
              sidebar/header stay put, so navigation feels instant. */}
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
