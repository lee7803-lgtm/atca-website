import SiteHeader from '@/components/site-header';

const sections = [
  {
    title: '组织架构示意',
    content: '协会采用“理事会—秘书处—专业委员会”三级协同机制。理事会负责战略方向，秘书处负责执行与运营，专业委员会负责学术、课程与国际合作事务。'
  },
  {
    title: '发展方向',
    content: '围绕道教文化教育、公共文化传播、青年人才培养与区域合作网络四条主线推进，形成可持续的长期发展模型。'
  },
  {
    title: '国际合作方向',
    content: '重点推进东盟区域宫观互访、跨校课程共建、国际论坛联合举办与文化研究成果共享，提升区域文化协同能力。'
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
