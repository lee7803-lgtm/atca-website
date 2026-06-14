import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CmsChannelTable, CmsQuickLinks } from "@/components/admin/CmsAdminViews";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "栏目管理｜国际道教与文化协会 ITCA"
};

export default function AdminContentChannelsPage() {
  requireAdminPage();

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={<CmsQuickLinks />} eyebrow="Channels" intro="管理顶部导航、二级导航、核心路径保护、排序、显示状态和频道页面入口。第一版仅展示结构化配置数据，不写数据库。" title="栏目管理" />
      <CmsChannelTable />
    </div>
  );
}
