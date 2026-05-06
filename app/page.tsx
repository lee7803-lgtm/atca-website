import Link from 'next/link';
import SiteHeader from '@/components/site-header';

const sections = [
  { title: '协会介绍', href: '/association', text: '了解协会缘起、宗旨愿景与组织架构，认识我们的文化使命。' },
  { title: '认证体系', href: '/certification', text: '查看道教文化课程、导师认证与研习进阶的静态说明。' },
  { title: '会员申请', href: '/membership', text: '浏览入会资格、申请流程与会员权益，提交前可先准备资料。' },
  { title: '联系我们', href: '/contact', text: '查看办公地址、邮箱与咨询方式，便于文化交流与活动合作。' }
];

const highlights = [
  { title: '协会愿景', text: '建设面向东盟与全球华人社群的专业道教文化平台，推动传统智慧在当代社会的可持续传播。' },
  { title: '国际文化交流定位', text: '以跨区域学术合作、礼仪互访与公共文化项目为核心，连接宫观、院校与文化机构。' },
  { title: '道家文化现代化表达', text: '通过课程体系、数字内容与城市文化活动，形成更易理解、更可参与的现代传播路径。' }
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-ink via-charcoal to-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(212,175,55,0.18),transparent_42%),radial-gradient(circle_at_78%_20%,rgba(245,214,123,0.12),transparent_35%),radial-gradient(circle_at_80%_82%,rgba(212,175,55,0.12),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background:linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_100%)]" />

      <SiteHeader currentPath="/" />

      <section className="fade-in mx-auto grid w-full max-w-7xl items-center gap-16 px-6 pb-16 pt-6 md:grid-cols-2 md:px-12 md:pt-12">
        <div className="space-y-10">
          <p className="text-xs uppercase tracking-[0.35em] text-gold/90">Asean Taoist & Cultural Association</p>
          <h1 className="font-serif text-4xl leading-tight text-zinc-100 md:text-6xl">
            东盟道教与文化协会
            <span className="mt-4 block text-2xl font-normal text-amber/90 md:text-3xl">静以修身 · 和以弘道</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
            以东方美学为骨，以道教文化为心。我们连结东盟各地信众与文化伙伴，推动传统礼仪、学术交流与公益修习，让古老智慧在现代城市中安静生长。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/association" className="primary-btn">探索协会</Link>
            <Link href="/certificate-query" className="secondary-btn">证书查询</Link>
            <Link href="/membership" className="secondary-btn">会员申请</Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-gold/40 bg-black/30 p-8 backdrop-blur-md">
            <div className="space-y-6">
              {sections.map((section) => (
                <Link key={section.href} href={section.href} className="fade-in block border-l border-gold/60 pl-5 transition duration-300 hover:translate-x-1 hover:border-gold">
                  <h2 className="mb-2 text-lg text-amber">{section.title}</h2>
                  <p className="text-sm leading-relaxed text-zinc-300">{section.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="fade-in mx-auto grid w-full max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3 md:px-12">
        {highlights.map((item) => (
          <article key={item.title} className="content-card">
            <h3 className="mb-3 text-xl text-amber">{item.title}</h3>
            <p className="leading-relaxed text-zinc-300">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
