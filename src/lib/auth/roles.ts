/** Roles come ONLY from trusted app_metadata. user_metadata is never consulted. */
export type FieldSalesRole = "admin" | "supervisor" | "representative";

export type AccessState =
  | { status: "signed_out" }
  | { status: "no_role" }
  | { status: "invalid_claims"; detail: string }
  | { status: "granted"; role: FieldSalesRole; representativeId: string | null };

const ROLES: readonly FieldSalesRole[] = ["admin", "supervisor", "representative"];

interface UserLike {
  app_metadata?: Record<string, unknown> | null;
}

export function resolveAccess(user: UserLike | null | undefined): AccessState {
  if (!user) return { status: "signed_out" };
  const meta = user.app_metadata ?? {};
  const role = meta["field_sales_role"];
  if (role === undefined || role === null || role === "") return { status: "no_role" };
  if (typeof role !== "string" || !ROLES.includes(role as FieldSalesRole))
    return { status: "invalid_claims", detail: "قيمة الدور غير معروفة" };
  const rep = meta["field_sales_representative_id"];
  const repId = typeof rep === "string" || typeof rep === "number" ? String(rep) : null;
  if (role === "representative" && !repId)
    return { status: "invalid_claims", detail: "المندوب بدون معرّف مندوب" };
  return { status: "granted", role: role as FieldSalesRole, representativeId: repId };
}

export type Capability =
  | "view"
  | "manage_master_data"
  | "manage_assignments"
  | "confirm_sales"
  | "view_audit"
  | "admin_users";

const MATRIX: Record<FieldSalesRole, Capability[]> = {
  admin: ["view", "manage_master_data", "manage_assignments", "confirm_sales", "view_audit", "admin_users"],
  supervisor: ["view", "manage_assignments", "confirm_sales", "view_audit"],
  representative: ["view"],
};

export function can(access: AccessState, cap: Capability): boolean {
  return access.status === "granted" && MATRIX[access.role].includes(cap);
}

export const ROLE_LABEL: Record<FieldSalesRole, string> = {
  admin: "مدير النظام",
  supervisor: "مشرف",
  representative: "مندوب",
};