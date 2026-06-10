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
      intro="RBAC 角色用于将后台操作从单一管理员能力升级为角色化、权限化、可审计的管理体系。"
      items={rbacRoles.map((role) => ({ badge: role.key, text: role.text, title: role.title }))}
      notice="本页面为 V2.0 RBAC 角色体系设计入口；现有 ADMIN_PASSWORD fallback 继续可用，不影响 V1.3 后台登录。"
      title="角色权限"
    />
  );
}

