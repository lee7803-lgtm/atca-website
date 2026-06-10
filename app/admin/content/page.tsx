import type { Metadata } from "next";
import { AdminV2LinkActions, AdminV2Page } from "@/components/admin/AdminV2Page";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "内容管理｜国际道教与文化协会 ITCA"
};

const items = [
  { badge: "前台", title: "介绍", text: "维护协会宗旨、使命、定位、服务对象和国际合作方向。" },
  { badge: "前台", title: "规章制度", text: "维护章程、会员规则、认证建档、资料使用、隐私和合作规则。" },
  { badge: "前台", title: "道教信仰", text: "维护信仰文化、宫观文化、修行生活和公开表达边界。" },
  { badge: "前台", title: "教理教义", text: "维护经典导读、伦理修身、生命修炼、术语解释和学习路径。" },
  { badge: "前台", title: "文化交流", text: "维护国际交流、文化研究、课程研修、机构合作和活动记录。" },
  { badge: "公告", title: "公告管理", text: "承接认证、会员、证书核验、合作事项和系统通知的公开公告。" }
];

export default function AdminContentPage() {
  requireAdminPage();

  return (
    <AdminV2Page
      actions={<AdminV2LinkActions links={[{ href: "/intro", label: "查看前台介绍" }, { href: "/exchange", label: "查看文化交流" }]} />}
      eyebrow="Content"
      intro="内容管理用于后续把 V2.0 新增前台栏目纳入后台发布、审核、预览和下线流程。"
      items={items}
      notice="当前页面为管理入口和权限边界设计，不直接写入内容数据库。正式内容表结构需先提交 SQL 草案并人工确认。"
      title="内容管理"
    />
  );
}

