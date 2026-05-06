import Link from 'next/link';
import { siteNavItems } from '@/data/nav';

type SiteHeaderProps = {
  currentPath?: string;
};

export default function SiteHeader({ currentPath }: SiteHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-7xl px-6 py-7 md:px-12 md:py-9">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-lg tracking-[0.3em] text-amber transition hover:opacity-90">
          ATCA
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          {siteNavItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition duration-300 hover:text-amber ${isActive ? 'text-amber' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-300 md:hidden">
        {siteNavItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full border px-4 py-2.5 text-center transition duration-300 ${
                isActive
                  ? 'border-gold/80 bg-gold/10 text-amber'
                  : 'border-zinc-700 hover:border-gold/60 hover:text-amber'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
