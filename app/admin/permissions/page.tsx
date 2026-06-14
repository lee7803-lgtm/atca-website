import type { Metadata } from "next";
import { AdminV2LinkActions, AdminV2Page, AdminV2SimpleTable } from "@/components/admin/AdminV2Page";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { rbacPermissionModules } from "@/lib/v2/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "权限模块｜国际道教与文化协会 ITCA"
};

const owners: Record<string, string> = {
  后台总览: "全部后台角色",
  用户管理: "超级管理员 / 秘书处管理员",
  角色权限: "超级管理员",
  会员管理: "会员管理员 / 秘书处管理员",
  认证管理: "认证管理员 / 秘书处管理员",
  证书管理: "认证管理员",
  支付管理: "财务管理员",
  通知管理: "通知管理员 / 秘书处管理员",
  内容管理: "内容管理员",
  发展中心管理: "发展中心管理员",
  数据中心管理: "数据中心管理员",
  公告管理: "内容管理员 / 秘书处管理员",
  基础资料管理: "秘书处管理员 / 超级管理员",
  操作日志: "只读审计员 / 超级管理员",
  系统设置: "超级管理员"
};

export default function AdminPermissionsPage() {
  requireAdminPage();

  return (
    <AdminV2Page
      actions={<AdminV2LinkActions links={[{ href: "/admin/roles", label: "角色权限" }, { href: "/admin/audit-logs", label: "操作日志" }]} />}
      eyebrow="Permissions"
      intro="权限模块定义后台可见、可读、可写、可审核、可导出和可配置的能力边界。"
      notice="权限管理以不影响既有申请、审核、支付、证书、通知和基础资料流程为前提，所有关键操作应保留操作记录。"
      title="权限模块"
    >
      <AdminV2SimpleTable
        columns={["权限模块", "主管角色", "权限范围", "业务流程要求"]}
        rows={rbacPermissionModules.map((module) => [
          module,
          owners[module] || "超级管理员",
          module === "操作日志" ? "只读 / 导出" : module === "系统设置" || module === "角色权限" ? "配置 / 审计" : "查看 / 新增 / 编辑 / 审核",
          "不改变现有申请、审核、支付、证书、通知和基础资料业务状态"
        ])}
      />
    </AdminV2Page>
  );
}
