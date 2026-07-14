import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { FullscreenLoader } from "@/auth/guards";
import { roleHome } from "@/config/roles";

/**
 * Post-login / legacy-path landing gate. Sends the user to their role's shell.
 * Used for `/dashboard` and any other role-agnostic authenticated entry point.
 */
const RoleGate = () => {
  const { status, user } = useAuth();

  if (status === "loading") return <FullscreenLoader />;
  if (status !== "authenticated" || !user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(user.role)} replace />;
};

export default RoleGate;
