import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import { formatAdminPermission, hasAdminPermission, type AdminPermission } from "@/lib/admin/rbac";

export function requireAdminPage(permission?: AdminPermission) {
  const token = cookies().get(adminSessionCookieName)?.value;
  if (!isValidAdminSessionToken(token)) redirect("/admin");
  const session = getAdminSession(token);
  if (permission && !hasAdminPermission(session, permission)) redirect(`/admin?denied=${encodeURIComponent(permission)}`);
  return session;
}

export function getAdminCookieFromRequest(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${adminSessionCookieName}=`))
    ?.split("=")[1];
}

export function requireAdminApiPermission(request: Request, permission: AdminPermission) {
  const token = getAdminCookieFromRequest(request);
  if (!isValidAdminSessionToken(token)) {
    return {
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      session: null
    };
  }

  const session = getAdminSession(token);
  if (!hasAdminPermission(session, permission)) {
    return {
      response: NextResponse.json({ message: `当前角色无权执行：${formatAdminPermission(permission)}。` }, { status: 403 }),
      session
    };
  }

  return { response: null, session };
}
