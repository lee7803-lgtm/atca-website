import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CmsQuickLinks, CmsRevisionTable } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "版本记录｜国际道教与文化协会 ITCA"
};

export default function AdminContentRevisionsPage() {
  requireAdminPage("content:read");

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Revisions" intro="页面、栏目、内容、媒体和核心路径变更均需要版本记录和审计留痕。第一版展示结构化版本记录。" title="版本记录" />
      <CmsRevisionTable />
    </div>
  );
}
