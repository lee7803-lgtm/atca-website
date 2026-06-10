"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

type NavItem = {
  children?: Array<{ href: string; label: string }>;
  href: string;
  label: string;
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/intro", label: "介绍" },
  { href: "/rules", label: "规章制度" },
  { href: "/faith", label: "道教信仰" },
  { href: "/doctrine", label: "教理教义" },
  { href: "/exchange", label: "文化交流" },
  {
    href: "/development",
    label: "发展中心",
    children: [
      { href: "/development/health-practice", label: "养生与修炼发展中心" },
      { href: "/development/cultural-creative", label: "文创产业发展中心" },
      { href: "/development/education", label: "教育培训发展中心" },
      { href: "/development/international-exchange", label: "国际与交流发展中心" },
      { href: "/development/yijing-cognition", label: "易学与东方认知发展中心" },
      { href: "/development/dao-medicine", label: "道医中医研究发展中心" }
    ]
  },
  { href: "/membership", label: "会员认证" },
  { href: "/certificate-query", label: "证书查验" },
  { href: "/cooperation", label: "发展合作" },
  { href: "/data", label: "数据中心" },
  { href: "/account", label: "登录 / 用户中心" }
] satisfies NavItem[];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string, children?: NavItem["children"]) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`) || Boolean(children?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)));
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-full border-b border-[#d8d0bf] bg-[#f7f1e6]/98 shadow-[0_8px_22px_rgba(80,54,36,0.055)] backdrop-blur-md">
      <div className="max-w-full border-b border-[#e6ddcf] bg-[#eee5d8] px-4 py-1.5 text-center text-[10px] tracking-[0.12em] text-[#8a6b3e] sm:px-5 sm:text-xs sm:tracking-[0.22em]">
        道法自然 · 和合共生 · 弘道传承 · 文化互鉴 · 共创未来
      </div>
      <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-col gap-3 px-4 py-3 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:gap-5">
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

        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-1 border-x border-[#d8d0bf] bg-[#fbf8ef]/70 px-2 py-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href, item.children);

            return item.children ? (
              <div className="group relative" key={item.href}>
                <Link
                  className={`block border-b-2 px-2.5 py-2 text-[13px] font-medium transition xl:px-3 ${
                    active
                      ? "border-cinnabar text-cinnabar"
                      : "border-transparent text-[#33251F] hover:border-warmGold/60 hover:text-cinnabar"
                  }`}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="grid gap-1 rounded-xl border border-[#d8d0bf] bg-[#fbf8ef] p-2 shadow-[0_18px_45px_rgba(80,54,36,0.12)]">
                    {item.children.map((child) => (
                      <Link
                        className="rounded-lg px-3 py-2 text-sm leading-6 text-[#5f5b52] transition hover:bg-white hover:text-[#7F1D1D]"
                        href={child.href}
                        key={child.href}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                className={`border-b-2 px-2.5 py-2 text-[13px] font-medium transition xl:px-3 ${
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

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            href="/cooperation"
            className="rounded-xl bg-ritualRed px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_22px_rgba(80,54,36,0.1)] transition hover:bg-porcelain sm:px-5"
          >
            发展合作
          </Link>
        </div>
      </div>

      <div className="w-full max-w-full overflow-hidden px-4 pb-3 sm:px-8 lg:hidden">
        <nav className="grid max-w-full grid-cols-2 gap-1.5 border border-[#e4ded0] bg-white/82 p-1.5 shadow-[0_8px_20px_rgba(80,54,36,0.055)] sm:grid-cols-3">
          {navItems.map((item) => {
            const active = isActive(item.href, item.children);

            return item.children ? (
              <details className="col-span-2 min-w-0 rounded-lg bg-[#fbf8ef] sm:col-span-3" key={item.href} open={active}>
                <summary className={`cursor-pointer rounded-lg px-2 py-2 text-center text-sm leading-5 transition ${active ? "text-cinnabar" : "text-[#6b5a4e]"}`}>
                  {item.label}
                </summary>
                <div className="grid gap-1 p-1.5 sm:grid-cols-2">
                  <Link className="rounded-lg border border-[#e4ded0] bg-white px-2 py-2 text-center text-sm text-[#6b5a4e]" href={item.href}>
                    发展中心总览
                  </Link>
                  {item.children.map((child) => (
                    <Link className="rounded-lg border border-[#e4ded0] bg-white px-2 py-2 text-center text-sm text-[#6b5a4e]" href={child.href} key={child.href}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
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
