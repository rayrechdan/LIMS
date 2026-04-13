export const ROLES = {
  ADMIN: "ADMIN",
  LAB_MANAGER: "LAB_MANAGER",
  PATHOLOGIST: "PATHOLOGIST",
  TECHNICIAN: "TECHNICIAN",
  RECEPTIONIST: "RECEPTIONIST",
  DOCTOR: "DOCTOR",
  PATIENT: "PATIENT",
} as const;

export type Role = keyof typeof ROLES;

export const STAFF_ROLES: Role[] = ["ADMIN", "LAB_MANAGER", "PATHOLOGIST", "TECHNICIAN", "RECEPTIONIST"];

export function isStaff(role?: string | null) {
  return !!role && STAFF_ROLES.includes(role as Role);
}

export function canValidateResults(role?: string | null) {
  return role === "PATHOLOGIST" || role === "LAB_MANAGER" || role === "ADMIN";
}

export function canSignReports(role?: string | null) {
  return role === "PATHOLOGIST" || role === "LAB_MANAGER" || role === "ADMIN";
}

export function canManageUsers(role?: string | null) {
  return role === "ADMIN";
}

export function canManageInventory(role?: string | null) {
  return role === "ADMIN" || role === "LAB_MANAGER";
}
