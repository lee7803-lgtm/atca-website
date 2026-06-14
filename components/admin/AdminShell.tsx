import Link from "next/link";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/app/admin/AdminLogoutButton";
import { BrandMark } from "@/components/BrandMark";
import type { AdminSession } from "@/lib/admin/auth";
import { getAdminEnvironmentLabel, getAdminRoleLabel, getVisibleAdminNavGroups } from "@/lib/admin/rbac";

export function AdminShell({ children, session }: { children: ReactNode; session: AdminSession | null }) {
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f5efe4] text-ink">
        <header className="border-b border-[#e4ded0] bg-[#fbf8ef]/95 px-5 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <BrandMark size="sm" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-[0.22em] text-[#1B1B1B]">ITCA</span>
                <span className="block text-xs text-[#6b5a4e]">管理入口</span>
              </span>
            </Link>
            <Link className="shrink-0 rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink" href="/">
              返回前台
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    );
  }

  const navGroups = getVisibleAdminNavGroups(session);
  const flatNavItems = navGroups.flatMap((group) => group.items);
  const roleLabel = getAdminRoleLabel(session);
  const environmentLabel = getAdminEnvironmentLabel();

  return (
    <div className="min-h-screen bg-[#f5efe4] text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[#e4ded0] bg-[#fbf8ef]/95 px-4 py-5 lg:block">
          <Link className="flex items-center gap-3 rounded-xl px-2 py-2" href="/admin">
            <BrandMark size="sm" />
            <span>
              <span className="block text-xs font-semibold tracking-[0.22em] text-[#1B1B1B]">ITCA</span>
              <span className="block text-xs text-[#6b5a4e]">SaaS 运营后台</span>
            </span>
          </Link>
          <div className="mt-5 rounded-xl border border-[#ead7a5] bg-[#fff8df] p-3 text-xs leading-6 text-[#8a6b3e]">
            高风险模块需权限控制、操作原因、二次确认和审计留痕；预留模块先进入建设中壳层，不执行生产数据操作。
          </div>
          <div className="mt-3 grid gap-1 rounded-xl border border-[#d8d0bf] bg-white/80 p-3 text-xs leading-6 text-[#5f5b52]">
            <p><span className="font-semibold text-porcelain">当前角色：</span>{roleLabel}</p>
            <p><span className="font-semibold text-porcelain">当前环境：</span>{environmentLabel}</p>
          </div>
          <nav className="mt-7 grid gap-5">
            {navGroups.map((group) => (
              <div className="grid gap-1" key={group.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{group.title}</p>
                {group.items.map((item) => (
                  <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5f5b52] transition hover:bg-white hover:text-[#7F1D1D]" href={item.href} key={`${item.href}-${item.label}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span>{item.label}</span>
                      {item.reserved ? <span className="rounded-full bg-[#fbf0ec] px-2 py-0.5 text-[10px] text-[#7F1D1D]">建设中</span> : null}
                    </span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-[#8a8175]">{item.note}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="sticky bottom-0 mt-7 grid gap-2 border-t border-[#e4ded0] bg-[#fbf8ef]/95 pt-4">
            <Link className="rounded-lg border border-[#d8d0bf] bg-white px-3 py-2 text-center text-sm font-semibold text-ink" href="/">
              返回前台
            </Link>
            <AdminLogoutButton />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e4ded0] bg-[#f5efe4]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Operations Console</p>
                <p className="mt-1 text-sm text-[#5f5b52]">SaaS 化运营后台：申请、审核、财务、证书、内容、数据、通知、权限与审计</p>
              </div>
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {flatNavItems.map((item) => (
                  <Link className="shrink-0 rounded-full border border-[#d8d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-ink" href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="hidden items-center gap-2 lg:flex">
                <Link className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink" href="/">
                  前台首页
                </Link>
                <AdminLogoutButton />
              </div>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
