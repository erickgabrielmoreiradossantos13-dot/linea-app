import { describe, expect, it } from "vitest";
import { can, canEditContent, canManageMembers, canViewAdmin } from "../src/lib/authz";

describe("authorization matrix", () => {
  it("keeps viewer read-only", () => {
    expect(can("VIEWER", "EDITOR")).toBe(false);
    expect(canEditContent("VIEWER")).toBe(false);
  });

  it("allows editors to edit content but not members", () => {
    expect(canEditContent("EDITOR")).toBe(true);
    expect(canManageMembers("EDITOR")).toBe(false);
  });

  it("allows owners to manage members", () => {
    expect(canManageMembers("OWNER")).toBe(true);
  });

  it("reserves admin console to super admin", () => {
    expect(canViewAdmin("ADMIN")).toBe(false);
    expect(canViewAdmin("SUPER_ADMIN")).toBe(true);
  });
});
