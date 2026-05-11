import Link from "next/link";
import { cookies } from "next/headers";
import { AdminLoginForm } from "./AdminLoginForm";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminConfigError, adminSessionCookieName, getAdminPassword, isValidAdminSessionToken } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

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
      <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">当前阶段仅开放申请管理，用于查看申请、更新审核状态和填写审核备注。</p>

      {!isConfigured ? (
        <div className="mt-8 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          后台密码尚未配置，请先在本地环境变量中设置 ADMIN_PASSWORD。
        </div>
      ) : isAuthed ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/admin/applications">
            进入申请管理
          </Link>
          <AdminLogoutButton />
        </div>
      ) : (
        <AdminLoginForm />
      )}
    </section>
  );
}
