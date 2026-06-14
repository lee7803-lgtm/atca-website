import Link from "next/link";

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav className="section-surface border-b border-[#e4ded0]" aria-label="面包屑">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-4 text-xs leading-6 text-[#6b5a4e] sm:px-8">
        <Link className="font-semibold text-[#8a6b3e] hover:text-[#7F1D1D]" href="/">
          首页
        </Link>
        {items.map((item) => (
          <span className="flex min-w-0 items-center gap-2" key={`${item.href || "current"}-${item.label}`}>
            <span className="text-[#b9ad9c]">/</span>
            {item.href ? (
              <Link className="font-semibold text-[#8a6b3e] hover:text-[#7F1D1D]" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-porcelain">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
