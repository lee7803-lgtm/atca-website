import type { Metadata } from "next";
import { AdminSectionCard } from "@/components/admin/AdminUI";
import { AdminV2LinkActions, AdminV2Page } from "@/components/admin/AdminV2Page";
import { requireAdminPage } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "用户管理｜国际道教与文化协会 ITCA"
};

const items = [
  { badge: "账号", title: "注册用户", text: "面向普通访问者、文化爱好者和申请人，承接登录、资料维护、通知接收和既有申请绑定。" },
  { badge: "会员", title: "会员用户", text: "关联个人会员与机构会员申请记录，展示会员状态、有效期、续期提示和会员公开核验入口。" },
  { badge: "认证", title: "认证申请人", text: "关联认证申请、材料补正、证书状态和公开核验结果，不改变原有认证审核流程。" },
  { badge: "机构", title: "机构账号", text: "用于机构会员、合作机构、发展中心项目和资料中心入驻资料维护。" },
  { badge: "兼容", title: "历史申请绑定", text: "通过申请编号、姓名、手机号或邮箱匹配历史记录；绑定只做展示关联，不改原申请状态。" },
  { badge: "边界", title: "最小公开", text: "用户资料、证件、联系方式、Storage 路径和内部备注不得进入前台公开展示。" }
];

export default function AdminUsersPage() {
  requireAdminPage("users:read");

  return (
    <AdminV2Page
      actions={<AdminV2LinkActions links={[{ href: "/admin/roles", label: "角色权限" }, { href: "/account", label: "前台用户中心" }]} />}
      eyebrow="Users"
      intro="用户管理用于维护注册用户、会员、认证申请人、机构账号和历史申请关联能力。"
      items={items}
      notice="后台仍保留管理员密码兼容登录方式。账号服务开放前，历史申请、证书和订单以原有审核与查询记录为准。"
      title="用户管理"
    >
      <AdminSectionCard title="绑定策略">
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["申请编号 + 联系方式", "用于绑定个人会员、机构会员和认证申请，保留既有查询校验方式。"],
            ["证书编号 + 姓名", "用于绑定证书公开核验结果，不公开申请材料和后台审核意见。"],
            ["订单号 + 申请编号", "用于关联支付订单和收据，不改变支付状态管理流程。"]
          ].map(([title, text]) => (
            <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4" key={title}>
              <h2 className="font-serif text-xl text-porcelain">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{text}</p>
            </div>
          ))}
        </div>
      </AdminSectionCard>
    </AdminV2Page>
  );
}
