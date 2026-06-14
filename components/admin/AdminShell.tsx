import Link from "next/link";
import type { ReactNode } from "react";
import { AdminLogoutButton } from "@/app/admin/AdminLogoutButton";
import { BrandMark } from "@/components/BrandMark";

const navItems = [
  { href: "/admin", label: "总览" },
  { href: "/admin/workbench", label: "审核工作台" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/roles", label: "角色权限" },
  { href: "/admin/permissions", label: "权限模块" },
  { href: "/admin/applications", label: "会员申请" },
  { href: "/admin/certification-applications", label: "认证申请" },
  { href: "/admin/payments", label: "支付订单" },
  { href: "/admin/notifications", label: "通知记录" },
  { href: "/admin/content", label: "内容 CMS" },
  { href: "/admin/development", label: "发展中心" },
  { href: "/admin/data-center", label: "资料中心" },
  { href: "/admin/audit-logs", label: "操作记录" },
  { href: "/admin/master-data", label: "基础资料" }
];

export function AdminShell({ children, isAuthed }: { children: ReactNode; isAuthed: boolean }) {
  if (!isAuthed) {
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

  return (
    <div className="min-h-screen bg-[#f5efe4] text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[#e4ded0] bg-[#fbf8ef]/95 px-4 py-5 lg:block">
          <Link className="flex items-center gap-3 rounded-xl px-2 py-2" href="/admin">
            <BrandMark size="sm" />
            <span>
              <span className="block text-xs font-semibold tracking-[0.22em] text-[#1B1B1B]">ITCA</span>
              <span className="block text-xs text-[#6b5a4e]">后台管理台</span>
            </span>
          </Link>
          <nav className="mt-7 grid gap-1">
            {navItems.map((item) => (
              <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5f5b52] transition hover:bg-white hover:text-[#7F1D1D]" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sticky bottom-0 mt-7 grid gap-2 border-t border-[#e4ded0] bg-[#fbf8ef]/95 pt-4">
            <Link className="rounded-lg border border-[#d8d0bf] bg-white px-3 py-2 text-center text-sm font-semibold text-ink" href="/">
              返回前台
            </Link>
            {isAuthed ? <AdminLogoutButton /> : null}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e4ded0] bg-[#f5efe4]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Operations Console</p>
                <p className="mt-1 text-sm text-[#5f5b52]">审核、支付、通知与基础资料治理</p>
              </div>
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => (
                  <Link className="shrink-0 rounded-full border border-[#d8d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-ink" href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="hidden items-center gap-2 lg:flex">
                <Link className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink" href="/">
                  前台首页
                </Link>
                {isAuthed ? <AdminLogoutButton /> : null}
              </div>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
