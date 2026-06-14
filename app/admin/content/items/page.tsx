import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CmsContentItemsTable, CmsQuickLinks } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "内容库｜国际道教与文化协会 ITCA"
};

export default function AdminContentItemsPage() {
  requireAdminPage();

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Content Items" intro="内容库承接公告、制度、文化文章、FAQ 和活动报道。高风险内容进入加强审核。" title="内容库" />
      <CmsContentItemsTable />
    </div>
  );
}
