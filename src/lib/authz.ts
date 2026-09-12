import type { Role } from "@/lib/types";

const rank: Record<Role, number> = {
  VIEWER: 10,
  EDITOR: 20,
  ADMIN: 30,
  OWNER: 40,
  SUPER_ADMIN: 50,
};

export function can(role: Role, minimum: Role) {
  return rank[role] >= rank[minimum];
}

export function canManageMembers(role: Role) {
  return role === "OWNER" || role === "SUPER_ADMIN";
}

export function canEditContent(role: Role) {
  return can(role, "EDITOR");
}

export function canViewAdmin(role: Role) {
  return role === "SUPER_ADMIN";
}
