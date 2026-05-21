"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/association", label: "关于协会" },
  { href: "/certification", label: "认证体系" },
  { href: "/membership", label: "会员申请" },
  { href: "/certificate-query", label: "证书查询" },
  { href: "/contact", label: "联系合作" }
];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8d0bf] bg-[#f7f1e6]/98 shadow-[0_8px_22px_rgba(80,54,36,0.055)] backdrop-blur-md">
      <div className="border-b border-[#e6ddcf] bg-[#eee5d8] px-4 py-1.5 text-center text-[10px] tracking-[0.12em] text-[#8a6b3e] sm:px-5 sm:text-xs sm:tracking-[0.22em]">
        道法自然 · 和合共生 · 弘道传承 · 文化互鉴 · 共创未来
      </div>
      <div className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-8 lg:min-h-[76px] lg:grid-cols-[minmax(260px,1fr)_auto_minmax(130px,1fr)] lg:gap-6 lg:py-0">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <BrandMark size="md" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-[0.22em] text-[#1B1B1B]">
              ITCA
            </span>
            <span className="block truncate text-xs font-medium text-[#33251F] md:block">
              国际道教与文化协会
            </span>
            <span className="hidden truncate text-[11px] text-[#7a7a7a] xl:block">
              International Taoisme And Cultural Association
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 border-x border-[#d8d0bf] bg-[#fbf8ef]/70 px-2 py-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition xl:px-5 ${
                  active
                    ? "border-cinnabar text-cinnabar"
                    : "border-transparent text-[#33251F] hover:border-warmGold/60 hover:text-cinnabar"
                }`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-self-end gap-2 sm:flex">
          <Link
            href="/contact"
            className="rounded-xl bg-ritualRed px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_22px_rgba(80,54,36,0.1)] transition hover:bg-porcelain sm:px-5"
          >
            联系协会
          </Link>
        </div>
      </div>

      <div className="max-w-full px-4 pb-3 sm:px-8 lg:hidden">
        <nav className="grid max-w-full grid-cols-3 gap-1.5 border border-[#e4ded0] bg-white/82 p-1.5 shadow-[0_8px_20px_rgba(80,54,36,0.055)]">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                className={`min-w-0 rounded-lg px-2 py-2 text-center text-sm leading-5 transition sm:rounded-xl sm:px-3.5 ${
                  active ? "bg-[#f3eadb] text-cinnabar" : "text-[#6b5a4e] hover:bg-[#fbf8ef] hover:text-inkBrown"
                }`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
