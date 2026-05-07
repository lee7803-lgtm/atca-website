import SiteHeader from '@/components/layout/site-header';

const sections = [
  {
    title: '组织架构示意',
    content:
      '协会实行“理事会—秘书处—专业委员会”治理架构。理事会负责中长期战略，秘书处负责项目执行与行政运营，专业委员会覆盖学术、课程、国际合作与公益事务。'
  },
  {
    title: '发展方向',
    content:
      '未来将重点推进课程标准化、师资体系建设、青年人才培养与社会服务机制，形成“研究—教学—实践—传播”闭环生态。'
  },
  {
    title: '国际合作方向',
    content:
      '围绕区域论坛共办、研究课题协同、文化访问与课程互认开展合作，逐步建立东盟范围内具有持续性的文化协作网络。'
  }
];

export default function AssociationPage() {
  return (
    <main className="page-shell">
      <SiteHeader currentPath="/association" />
      <section className="page-section space-y-12 fade-in">
        <h1 className="page-title">协会介绍</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="content-card">
              <h2 className="mb-3 text-xl text-amber">{section.title}</h2>
              <p className="leading-relaxed text-zinc-300">{section.content}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
