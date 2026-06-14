import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CmsPagesTable, CmsQuickLinks } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "页面管理｜国际道教与文化协会 ITCA"
};

export default function AdminContentPagesPage() {
  requireAdminPage("content:read");

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Pages" intro="频道页、子频道页和聚合页统一进入页面管理。页面通过受控区块编辑，发布前进入审核流程。" title="页面管理" />
      <CmsPagesTable />
    </div>
  );
}
