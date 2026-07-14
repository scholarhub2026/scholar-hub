// Central, data-driven role config. Adding a new role (e.g. PARENT) should be a
// change *here* — a new entry — not a refactor across the app.
// See docs/PARENT_ROLE_FUTURE.md for the planned PARENT role.

export const ROLES = {
  ADMIN: "ADMIN",
  TUTOR: "TUTOR",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Lowercase UI slug used by legacy components and layout nav. */
export type RoleSlug = "admin" | "mentor" | "student";

export const roleSlug = (role?: string | null): RoleSlug => {
  switch (role) {
    case ROLES.ADMIN:
      return "admin";
    case ROLES.TUTOR:
      return "mentor";
    default:
      return "student";
  }
};

/** Where each role lands after login / when hitting a wrong-role URL. */
export const roleHome = (role?: string | null): string => {
  switch (role) {
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.TUTOR:
      return "/mentor";
    default:
      return "/app";
  }
};

/** URL base for a role's authenticated shell. */
export const roleBase = (slug: RoleSlug): string =>
  slug === "admin" ? "/admin" : slug === "mentor" ? "/mentor" : "/app";
