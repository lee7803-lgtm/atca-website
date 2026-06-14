import type { Metadata } from "next";
import { AdminV2LinkActions, AdminV2Page } from "@/components/admin/AdminV2Page";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { rbacRoles } from "@/lib/v2/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "角色权限｜国际道教与文化协会 ITCA"
};

export default function AdminRolesPage() {
  requireAdminPage();

  return (
    <AdminV2Page
      actions={<AdminV2LinkActions links={[{ href: "/admin/permissions", label: "权限模块" }, { href: "/admin/users", label: "用户管理" }]} />}
      eyebrow="Roles"
      intro="角色权限用于将后台操作按岗位职责划分为可见、可读、可写、可审核和可审计的管理范围。"
      items={rbacRoles.map((role) => ({ badge: role.key, text: role.text, title: role.title }))}
      notice="现有管理员密码兼容登录方式继续可用，不影响会员申请、认证审核、支付确认、通知和基础资料管理流程。"
      title="角色权限"
    />
  );
}
