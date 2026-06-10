import type { Metadata } from "next";
import { AdminV2LinkActions, AdminV2Page } from "@/components/admin/AdminV2Page";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { developmentCenters } from "@/lib/v2/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "发展中心管理｜国际道教与文化协会 ITCA"
};

export default function AdminDevelopmentPage() {
  requireAdminPage();

  return (
    <AdminV2Page
      actions={<AdminV2LinkActions links={[{ href: "/development", label: "前台发展中心" }, { href: "/cooperation", label: "发展合作" }]} />}
      eyebrow="Development"
      intro="发展中心管理用于维护六大发展中心、专委会、项目合作、课程活动、合作机构和公开展示状态。"
      items={developmentCenters.map((center) => ({ badge: "中心", text: center.text, title: center.title }))}
      notice="道医中医、易学与东方认知、认证相关内容发布前必须经过边界说明和内容审查。"
      title="发展中心管理"
    />
  );
}

