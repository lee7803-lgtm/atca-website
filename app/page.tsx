import SiteHeader from '@/components/layout/site-header';
import PageHero from '@/components/ui/page-hero';
import CTAButton from '@/components/ui/cta-button';
import ContentCard from '@/components/ui/content-card';

const sections = [
  { title: '协会介绍', href: '/association', text: '了解协会缘起、组织结构与发展方向，全面认识协会治理体系。' },
  { title: '认证体系', href: '/certification', text: '查看认证流程、等级标准与执行规范，建立清晰专业认知。' },
  { title: '会员申请', href: '/membership', text: '了解会员权益、参与路径与常见问题，便于高效完成申请准备。' },
  { title: '联系我们', href: '/contact', text: '获取合作与交流方式，连接课程、学术与国际文化合作资源。' }
];

const highlights = [
  { title: '协会愿景', text: '打造面向东盟及国际社会的道家文化专业平台，推动传统智慧在教育、公益与社会治理领域形成长期价值。' },
  { title: '国际文化交流定位', text: '以“学术互鉴、礼仪互访、项目共建”为核心定位，促进跨地区机构之间的稳定协作与文化互信。' },
  { title: '道家文化现代化表达', text: '通过课程体系化、内容数字化与城市公共传播，构建更符合当代传播逻辑的道家文化表达方式。' }
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-ink via-charcoal to-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(212,175,55,0.18),transparent_42%),radial-gradient(circle_at_78%_20%,rgba(245,214,123,0.12),transparent_35%),radial-gradient(circle_at_80%_82%,rgba(212,175,55,0.12),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background:linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_100%)]" />
      <SiteHeader currentPath="/" />
      <PageHero>
        <section className="grid items-center gap-16 md:grid-cols-2">
          <div className="space-y-10">
            <p className="text-xs uppercase tracking-[0.35em] text-gold/90">Asean Taoist & Cultural Association</p>
            <h1 className="font-serif text-4xl leading-tight text-zinc-100 md:text-6xl">东盟道教与文化协会<span className="mt-4 block text-2xl font-normal text-amber/90 md:text-3xl">静以修身 · 和以弘道</span></h1>
            <p className="max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">协会秉承“文化传承、学术共建、社会服务”三位一体的发展路径，持续推动道家文化在当代社会中的专业化、国际化与公共化传播。</p>
            <div className="flex flex-wrap gap-4"><CTAButton href="/association" label="探索协会" variant="primary" /><CTAButton href="/certificate-query" label="证书查询" /><CTAButton href="/membership" label="会员申请" /></div>
          </div>
          <div className="rounded-3xl border border-gold/40 bg-black/30 p-8 backdrop-blur-md"><div className="space-y-6">{sections.map((section)=><a key={section.href} href={section.href} className="fade-in block border-l border-gold/60 pl-5 transition duration-300 hover:translate-x-1 hover:border-gold"><h2 className="mb-2 text-lg text-amber">{section.title}</h2><p className="text-sm leading-relaxed text-zinc-300">{section.text}</p></a>)}</div></div>
        </section>
      </PageHero>
      <section className="fade-in mx-auto grid w-full max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3 md:px-12">{highlights.map((item)=><ContentCard key={item.title}><h3 className="mb-3 text-xl text-amber">{item.title}</h3><p className="leading-relaxed text-zinc-300">{item.text}</p></ContentCard>)}</section>
    </main>
  );
}
