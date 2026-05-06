import Link from 'next/link';
import { siteNavItems } from '@/data/nav';

export default function SiteFooter() {
  return (
    <footer className="border-t border-gold/20 bg-black/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 md:px-12">
        <div className="space-y-3">
          <h2 className="font-serif text-2xl text-amber">东盟道教与文化协会</h2>
          <p className="text-sm text-zinc-300">Asean Taoism And Cultural Association</p>
          <p className="text-sm tracking-[0.25em] text-gold/90">ATCA</p>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.3em] text-zinc-500">快速导航</h3>
          <nav className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
            {siteNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition duration-300 hover:text-amber">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-gold/10 px-6 py-5 text-center text-xs text-zinc-500 md:px-12">
        © {new Date().getFullYear()} 东盟道教与文化协会 ATCA. 保留所有权利。
      </div>
    </footer>
  );
}
