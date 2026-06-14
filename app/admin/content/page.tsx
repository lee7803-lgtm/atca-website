import type { Metadata } from "next";
import { CmsDashboard } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "内容管理 V3.0｜国际道教与文化协会 ITCA"
};

export default function AdminContentPage() {
  requireAdminPage("content:read");
  return <CmsDashboard />;
}
