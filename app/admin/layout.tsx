import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const session = getAdminSession(cookies().get(adminSessionCookieName)?.value);
  return <AdminShell session={session}>{children}</AdminShell>;
}
