import SiteHeader from '@/components/site-header';

const rights = ['参与协会课程与文化活动', '优先获取论坛与讲座席位', '可申请志愿服务与专项项目', '获得协会资讯与年度成果报告'];

const participation = ['道教文化公开课与专题工作坊', '区域文化交流访问项目', '公益服务与青年培养计划', '学术研讨与内容共创活动'];

const faq = [
  { q: '是否必须具备道教背景才能申请？', a: '不必须。只要认同协会宗旨并愿意遵守会员规范，均可申请。' },
  { q: '申请后多久会收到回复？', a: '一般在 5-10 个工作日内由秘书处进行人工联系。' },
  { q: '会员资格是否需要年度更新？', a: '协会将按年度进行资格确认与信息更新，以确保服务质量。' }
];

export default function MembershipPage() {
  return (
    <main className="page-shell">
      <SiteHeader currentPath="/membership" />
      <section className="page-section space-y-12 fade-in">
        <h1 className="page-title">会员申请</h1>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">会员权益</h2>
          <ul className="list-disc space-y-2 pl-6 text-zinc-300">{rights.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">加入后可参与内容</h2>
          <ul className="list-disc space-y-2 pl-6 text-zinc-300">{participation.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">常见问题 FAQ</h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q} className="border-l border-gold/50 pl-4">
                <p className="mb-1 text-zinc-100">Q：{item.q}</p>
                <p className="text-zinc-300">A：{item.a}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
