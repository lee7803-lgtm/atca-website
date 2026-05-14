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
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Admin</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">后台管理</h1>
      <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">后台用于查看会员申请、认证申请、更新审核状态、填写审核备注和生成证书记录。</p>
      <div className="mt-6">
        <Link className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/">
          返回前台首页
        </Link>
      </div>

      {!isConfigured ? (
        <div className="mt-8 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          后台密码尚未配置，请先在本地环境变量中设置 ADMIN_PASSWORD。
        </div>
      ) : isAuthed ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/admin/applications">
            会员申请管理
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-center text-sm font-semibold text-ink" href="/admin/certification-applications">
            认证申请管理
          </Link>
          <AdminLogoutButton />
        </div>
      ) : (
        <AdminLoginForm />
      )}
    </section>
  );
}
