import { describe, expect, it } from "vitest";
import { ROLES, roleBase, roleHome, roleSlug } from "./roles";

describe("roleSlug", () => {
  it("maps backend roles to UI slugs", () => {
    expect(roleSlug(ROLES.ADMIN)).toBe("admin");
    expect(roleSlug(ROLES.TUTOR)).toBe("mentor");
    expect(roleSlug(ROLES.STUDENT)).toBe("student");
  });

  it("defaults unknown / missing roles to student", () => {
    expect(roleSlug(undefined)).toBe("student");
    expect(roleSlug(null)).toBe("student");
    expect(roleSlug("SOMETHING_ELSE")).toBe("student");
  });
});

describe("roleHome", () => {
  it("routes each role to its own shell", () => {
    expect(roleHome(ROLES.ADMIN)).toBe("/admin");
    expect(roleHome(ROLES.TUTOR)).toBe("/mentor");
    expect(roleHome(ROLES.STUDENT)).toBe("/app");
  });

  it("defaults unknown / missing roles to the student app", () => {
    expect(roleHome(undefined)).toBe("/app");
    expect(roleHome("nonsense")).toBe("/app");
  });
});

describe("roleBase", () => {
  it("returns the URL base per slug", () => {
    expect(roleBase("admin")).toBe("/admin");
    expect(roleBase("mentor")).toBe("/mentor");
    expect(roleBase("student")).toBe("/app");
  });
});

describe("roleHome ∘ roleSlug consistency", () => {
  it("home and base agree for every role", () => {
    for (const role of Object.values(ROLES)) {
      expect(roleBase(roleSlug(role))).toBe(roleHome(role));
    }
  });
});
