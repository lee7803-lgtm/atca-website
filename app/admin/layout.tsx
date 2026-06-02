import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const isAuthed = isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value);
  return <AdminShell isAuthed={isAuthed}>{children}</AdminShell>;
}
