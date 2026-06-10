import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";

export function requireAdminPage() {
  const token = cookies().get(adminSessionCookieName)?.value;
  if (!isValidAdminSessionToken(token)) redirect("/admin");
  return getAdminSession(token);
}

