import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { roleHome, type Role } from "@/config/roles";

export const FullscreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const loginRedirect = (pathname: string) => (
  <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
);

/** Requires any authenticated session. */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullscreenLoader />;
  if (status !== "authenticated") return loginRedirect(location.pathname);
  return <>{children}</>;
};

/**
 * Requires an authenticated session AND one of the given roles.
 * Wrong role → sent to that user's own home (not the login page), so there's
 * no confusing redirect loop.
 */
export const RequireRole = ({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullscreenLoader />;
  if (status !== "authenticated" || !user) return loginRedirect(location.pathname);
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return <>{children}</>;
};
