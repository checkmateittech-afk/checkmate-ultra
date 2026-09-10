import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const ADMIN_AREA_ROLES = ["ADMIN", "MODERATOR", "EDITOR"];

/** Anyone allowed into /admin (includes content EDITORs). */
export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!ADMIN_AREA_ROLES.includes(user.role)) redirect("/account");
  return user;
}

/** Full marketplace staff — EDITORs are bounced to the content area. */
export async function requireFullStaff() {
  const user = await requireAdminUser();
  if (user.role === "EDITOR") redirect("/admin/courses");
  return user;
}

/** Super admin only. */
export async function requireSuperAdmin() {
  const user = await requireAdminUser();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}
