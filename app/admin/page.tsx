import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLoginForm } from "./AdminLoginForm";
import { AdminPageHeader, AdminSectionCard, AdminStatCard } from "@/components/admin/AdminUI";
import { AdminConfigError, adminSessionCookieName, getAdminPassword, getAdminSession } from "@/lib/admin/auth";
import { formatAdminPermission, getAccessibleModuleLabels, hasAdminPermission, type AdminPermission } from "@/lib/admin/rbac";
import { listAdminApplications } from "@/lib/api/admin-applications";
import { listPaymentOrders } from "@/lib/api/payments";
import { listNotificationLogs } from "@/lib/notifications/admin";
import { listCertificationApplications } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "后台管理｜国际道教与文化协会 ITCA"
};

export default async function AdminPage({ searchParams }: { searchParams?: { denied?: string } }) {
  let isConfigured = true;

  try {
    getAdminPassword();
  } catch (error) {
    if (error instanceof AdminConfigError) isConfigured = false;
  }

  const session = isConfigured ? getAdminSession(cookies().get(adminSessionCookieName)?.value) : null;
  const stats = session ? await getDashboardStats() : null;
  const deniedPermission = parseDeniedPermission(searchParams?.denied);

  if (!isConfigured) {
    return (
      <section className="mx-auto max-w-lg">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          后台密码尚未配置，请先完成服务端后台密码环境配置。
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Admin</p>
        <h1 className="mt-3 font-serif text-3xl text-porcelain">管理员登录</h1>
        <p className="mt-3 text-sm leading-7 text-[#5f5b52]">本入口仅供协会授权管理人员使用。请使用管理员密码进入后台。</p>
        <AdminLoginForm />
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader
        eyebrow="Operations Workbench"
        intro="SaaS 化运营后台用于处理申请、审核、财务、会员、认证证书、内容、发展中心、数据、通知、权限与审计。高风险模块需权限、审计和二次确认。"
        title="工作台"
      />
      {deniedPermission ? (
        <div className="rounded-xl border border-[#e4b8b2] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          当前角色无权访问：{formatAdminPermission(deniedPermission)}。可访问模块：{getAccessibleModuleLabels(session).join("、") || "后台首页"}。
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="会员待审核" note={stats?.memberMessage || "已提交 / 待处理 / 审核中 / 需补充资料"} value={stats?.memberPending ?? "—"} />
        <AdminStatCard label="认证待审核" note={stats?.certificationMessage || "已提交 / 审核中 / 需补充资料"} value={stats?.certificationPending ?? "—"} />
        <AdminStatCard label="支付待处理" note={stats?.paymentMessage || "待付款 / 人工确认 / 支付失败"} value={stats?.paymentPending ?? "—"} />
        <AdminStatCard label="通知待处理" note={stats?.notificationMessage || "待发送 / 发送失败"} value={stats?.notificationPending ?? "—"} />
      </div>
      <AdminSectionCard title="今日待办">
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {hasAdminPermission(session, "applications:read") ? <AdminQueueRow href="/admin/applications" label="待审核申请" owner="申请审核员" text="个人会员、机构会员申请进入资料核对、补件或审核结论。" value={stats?.memberPending ?? "—"} /> : null}
          {hasAdminPermission(session, "payments:read") ? <AdminQueueRow href="/admin/payments" label="待付款确认" owner="财务审核员" text="Bank Transfer 订单、凭证和人工确认，影响申请流转状态。" value={stats?.paymentPending ?? "—"} /> : null}
          {hasAdminPermission(session, "workbench:read") ? <AdminQueueRow href="/admin/workbench" label="待补件" owner="申请审核员" text="需补充资料的申请应给出明确反馈，不公开内部备注。" value="按列表筛选" /> : null}
          {hasAdminPermission(session, "certification:read") ? <AdminQueueRow href="/admin/certification-applications" label="待发证" owner="证书管理员" text="认证审核通过后生成证书记录、PDF 和公开核验字段。" value={stats?.certificationPending ?? "—"} /> : null}
          {hasAdminPermission(session, "content:read") ? <AdminQueueRow href="/admin/content/reviews" label="待发布内容" owner="内容管理员" text="频道首页、公告、发展中心、资料中心内容进入草稿 / 待审 / 已发布流程。" value="静态 CMS" /> : null}
          {hasAdminPermission(session, "notifications:read") ? <AdminQueueRow href="/admin/notifications" label="通知待处理" owner="通知管理员" text="失败或待发送通知需复核，不暴露服务端凭证和敏感字段。" value={stats?.notificationPending ?? "—"} /> : null}
        </div>
      </AdminSectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminSectionCard title="最近操作记录">
          <div className="mt-5 grid gap-3 text-sm leading-7 text-[#5f5b52]">
            <p className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4">审计日志入口已保留，关键操作如付款确认、证书生成、状态变更、联系方式修正应写入 audit_logs。</p>
            <p className="rounded-xl border border-dashed border-[#d8d0bf] bg-white/80 p-4">暂无可公开展示的最近操作摘要；拿到后台测试账号后需按角色复核可见范围。</p>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="风险提醒">
          <div className="mt-5 grid gap-3 text-sm leading-7 text-[#5f5b52]">
            <p className="rounded-xl border border-[#ead7a5] bg-[#fff8df] p-4">Preview 环境只用于验收，不发布 Production，不执行 SQL，不修改数据库。</p>
            <p className="rounded-xl border border-[#e4b8b2] bg-[#fbf0ec] p-4">权限、财务、证书、公开字段、撤回和风控操作需要二次确认和审计留痕。</p>
          </div>
        </AdminSectionCard>
      </div>

      <AdminSectionCard title="快捷入口">
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {hasAdminPermission(session, "applications:read") ? <AdminEntryCard href="/admin/applications" title="申请与审核" text="会员、机构申请、补件和记录治理。数据来自 application 相关后台接口。" /> : null}
          {hasAdminPermission(session, "certification:read") ? <AdminEntryCard href="/admin/certification-applications" title="认证与证书" text="认证建档、材料审核、证书生成、PDF、下发和公开核验状态。" /> : null}
          {hasAdminPermission(session, "content:read") ? <AdminEntryCard href="/admin/content" title="内容 CMS" text="频道首页、公告、栏目模块、推荐位、发布状态和版本记录。" /> : null}
          {hasAdminPermission(session, "roles:read") ? <AdminEntryCard href="/admin/roles" title="权限与组织" text="租户、组织、角色、菜单权限、危险操作确认和 SaaS 化模块授权预留。" /> : null}
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="后台模块分组与边界">
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminBoundary title="申请与审核" text="管理个人会员、机构会员、认证建档、材料审核、付款审核、证书生成、补件和审核日志。" />
          <AdminBoundary title="内容管理 CMS" text="管理频道首页、文章公告、栏目模块、发展中心内容、资料中心内容、推荐位和内容预览。" />
          <AdminBoundary title="会员与认证数据" text="管理会员档案、机构档案、认证档案、证书记录、公开核验状态和公开字段控制。" />
          <AdminBoundary title="用户与权限" text="预留管理员用户、角色、权限、用户账号、禁用 / 邀请、租户、组织和模块授权。" />
          <AdminBoundary title="主数据配置" text="维护引荐人、宫观机构、认证等级、申请类型、材料模板、通知模板、费用和公开字段配置。" />
          <AdminBoundary title="系统与审计" text="保留操作日志、通知日志、导出记录、异常记录、系统状态和 Preview / Production 环境提示。" />
        </div>
      </AdminSectionCard>
    </section>
  );
}

function parseDeniedPermission(value?: string): AdminPermission | null {
  if (!value || !value.includes(":")) return null;
  return value as AdminPermission;
}

async function getDashboardStats() {
  const [members, certifications, payments, notifications] = await Promise.allSettled([
    listAdminApplications({ pageSize: 100 }),
    listCertificationApplications(),
    listPaymentOrders({ pageSize: 100 }),
    listNotificationLogs({ limit: 100 })
  ]);

  return {
    memberPending: members.status === "fulfilled" ? members.value.filter((item) => ["submitted", "pending_review", "under_review", "need_more_info"].includes(item.status)).length : "—",
    memberMessage: members.status === "fulfilled" ? "" : "会员申请暂时无法读取",
    certificationPending: certifications.status === "fulfilled" ? certifications.value.filter((item) => ["submitted", "under_review", "need_more_info"].includes(item.status)).length : "—",
    certificationMessage: certifications.status === "fulfilled" ? "" : "认证申请暂时无法读取",
    paymentPending: payments.status === "fulfilled" ? payments.value.filter((item) => ["pending_payment", "manual_review", "failed"].includes(item.status)).length : "—",
    paymentMessage: payments.status === "fulfilled" ? "" : "支付订单暂时无法读取",
    notificationPending: notifications.status === "fulfilled" ? notifications.value.filter((item) => ["pending", "failed"].includes(item.sendStatus)).length : "—",
    notificationMessage: notifications.status === "fulfilled" ? "" : "通知记录暂时无法读取"
  };
}

function AdminEntryCard({ href, text, title }: { href: string; text: string; title: string }) {
  return (
    <Link className="group rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-5 transition hover:border-gold/50 hover:bg-white" href={href}>
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{text}</p>
      <span className="mt-5 inline-flex rounded-full bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#6f1919]">
        进入管理
      </span>
    </Link>
  );
}

function AdminQueueRow({ href, label, owner, text, value }: { href: string; label: string; owner: string; text: string; value: string | number }) {
  return (
    <Link className="grid gap-3 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 transition hover:border-gold/50 hover:bg-white md:grid-cols-[8rem_minmax(0,1fr)]" href={href}>
      <div>
        <p className="font-serif text-2xl text-porcelain">{value}</p>
        <p className="mt-1 text-xs font-semibold text-[#8a6b3e]">{owner}</p>
      </div>
      <div>
        <h2 className="text-base font-semibold text-porcelain">{label}</h2>
        <p className="mt-2 text-sm leading-7 text-[#5f5b52]">{text}</p>
      </div>
    </Link>
  );
}

function AdminBoundary({ text, title }: { text: string; title: string }) {
  return (
    <article className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
      <h2 className="font-serif text-xl text-porcelain">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{text}</p>
    </article>
  );
}
