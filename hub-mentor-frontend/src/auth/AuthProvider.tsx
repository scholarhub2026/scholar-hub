import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axiosInstance from "@/lib/axios";
import { onForceLogout } from "./authEvents";
import { ROLES, type Role } from "@/config/roles";

export type AuthUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: Role;
  completedProfile?: boolean;
  isFirstLogin?: boolean;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** Persist the session after a successful login. Returns the normalized user. */
  login: (token: string, rawUser: unknown) => AuthUser;
  /** Clear the session (no navigation — guards handle redirects). */
  logout: () => void;
  /** Re-verify the token against the backend and refresh the user. */
  refresh: () => Promise<void>;
};

const TOKEN_KEY = "token";

// The API returns snake_case in places (completed_profile, is_first_login) and
// uses `id` or `_id` — normalize to one shape the app can rely on.
const normalizeUser = (raw: unknown): AuthUser => {
  const u = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(u.id ?? u._id ?? ""),
    firstName: u.firstName as string | undefined,
    lastName: u.lastName as string | undefined,
    email: u.email as string | undefined,
    role: (u.role as Role) ?? ROLES.STUDENT,
    completedProfile: Boolean(u.completedProfile ?? u.completed_profile ?? false),
    isFirstLogin: Boolean(u.isFirstLogin ?? u.is_first_login ?? false),
  };
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const login = useCallback((token: string, rawUser: unknown): AuthUser => {
    localStorage.setItem(TOKEN_KEY, token);
    const normalized = normalizeUser(rawUser);
    setUser(normalized);
    setStatus("authenticated");
    return normalized;
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const res = await axiosInstance.get("/auth/verify-token");
      if (res.data?.user) {
        setUser(normalizeUser(res.data.user));
        setStatus("authenticated");
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [logout]);

  // Verify on boot, and let the axios layer force a logout on a hard 401.
  useEffect(() => {
    const unsubscribe = onForceLogout(() => logout());
    void refresh();
    return unsubscribe;
  }, [logout, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      refresh,
    }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
};
