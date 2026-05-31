import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLoginForm } from "./AdminLoginForm";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminConfigError, adminSessionCookieName, getAdminPassword, isValidAdminSessionToken } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "后台管理｜国际道教与文化协会 ITCA"
};

export default function AdminPage() {
  let isConfigured = true;

  try {
    getAdminPassword();
  } catch (error) {
    if (error instanceof AdminConfigError) isConfigured = false;
  }

  const isAuthed = isConfigured && isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Admin Console</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">后台管理</h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[#5f5b52]">
              用于秘书处查看会员申请、认证申请，处理审核状态、审核备注、材料核验与证书生成相关记录。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/">
              返回前台首页
            </Link>
            {isAuthed ? <AdminLogoutButton /> : null}
          </div>
        </div>
      </div>

      {!isConfigured ? (
        <div className="mt-8 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          后台密码尚未配置，请先在本地环境变量中设置 ADMIN_PASSWORD。
        </div>
      ) : isAuthed ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <AdminEntryCard
            href="/admin/applications"
            index="01"
            title="会员申请管理"
            text="查看个人会员与机构会员申请，筛选状态，进入详情处理审核备注。"
          />
          <AdminEntryCard
            href="/admin/certification-applications"
            index="02"
            title="认证申请管理"
            text="查看道士资格认证申请，处理材料审核、审核反馈、证书生成与下发状态。"
          />
          <AdminEntryCard
            href="/admin/audit-logs"
            index="03"
            title="操作记录"
            text="查看后台关键写操作的基础审计记录，用于追踪审核状态修改和后续操作留痕。"
          />
          <AdminEntryCard
            href="/admin/notifications"
            index="04"
            title="通知记录"
            text="查看系统、邮件、WhatsApp 与人工处理通知记录，支持后续通知链路追踪。"
          />
        </div>
      ) : (
        <AdminLoginForm />
      )}
    </section>
  );
}

function AdminEntryCard({ href, index, text, title }: { href: string; index: string; text: string; title: string }) {
  return (
    <Link className="group rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate transition hover:border-gold/50 hover:bg-[#fffdf8] sm:p-7" href={href}>
      <p className="text-xs tracking-[0.24em] text-gold">{index}</p>
      <h2 className="mt-4 font-serif text-2xl text-porcelain">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{text}</p>
      <span className="mt-6 inline-flex rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[#6f1919]">
        进入管理
      </span>
    </Link>
  );
}
