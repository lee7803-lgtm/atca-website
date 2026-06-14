import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CmsQuickLinks, CmsReviewBoard } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "审核发布｜国际道教与文化协会 ITCA"
};

export default function AdminContentReviewsPage() {
  requireAdminPage("content:read");

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Review" intro="发布流程为草稿、预览、提交审核、秘书处/法务确认、发布、下架、归档。认证、道医、易学、隐私和费用内容必须加强审核。" title="审核发布" />
      <CmsReviewBoard />
    </div>
  );
}
