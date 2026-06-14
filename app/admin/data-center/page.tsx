import type { Metadata } from "next";
import { AdminV2LinkActions, AdminV2Page } from "@/components/admin/AdminV2Page";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { publicBoundaries } from "@/lib/v2/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "资料中心管理｜国际道教与文化协会 ITCA"
};

const items = [
  { badge: "公开库", title: "机构库", text: "宫观、道堂、协会、文化机构、研究机构、康养基地，经审核后展示公开字段。" },
  { badge: "公开库", title: "个人库", text: "道士、传承人、导师、研究者、讲师、顾问、文化从业者，遵循最小公开原则。" },
  { badge: "公开库", title: "平台库", text: "文化平台、课程平台、媒体账号、服务平台和合作系统。" },
  { badge: "公开库", title: "传承库", text: "门派、功法、师承、谱系、非遗线索与文化资料，需审核建档。" },
  { badge: "公开库", title: "课程 / 活动 / 基地库", text: "课程、产品、活动、养生基地、研修基地和合作场馆的公开资料。" },
  { badge: "治理", title: "纠错与撤回", text: "支持审核、隐藏、撤回、纠错、暂停展示和记录处置，不公开内部备注。" }
];

export default function AdminDataCenterPage() {
  requireAdminPage("dataCenter:read");

  return (
    <AdminV2Page
      actions={<AdminV2LinkActions links={[{ href: "/data", label: "前台资料中心" }, { href: "/admin/audit-logs", label: "操作日志" }]} />}
      eyebrow="Data Center"
      intro="资料中心管理用于审核和治理机构、个人、平台、传承、课程、产品、活动和基地等公开文化资料。"
      items={items}
      notice={publicBoundaries.data}
      title="资料中心管理"
    />
  );
}
