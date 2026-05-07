import SiteHeader from '@/components/layout/site-header';

const rights = [
  '优先参与协会课程、论坛与年度重点活动',
  '获取会员专属学术资料与文化研究简报',
  '可申请加入专项项目与跨区域文化交流计划',
  '享有协会合作资源对接与志愿服务优先权'
];

const participation = [
  '道教文化公开课、专题工作坊与经典导读课程',
  '区域文化访问、礼仪实践与公益服务行动',
  '青年培养计划、导师协作与项目共创机制',
  '学术论坛、论文交流与研究课题协作活动'
];

const faq = [
  { q: '申请会员是否有学历或宗教背景限制？', a: '协会重视文化认同与行为规范，不以单一学历或宗教背景作为硬性限制。' },
  { q: '申请审核通常需要多久？', a: '一般在 5-10 个工作日内完成秘书处初审，并安排后续人工沟通。' },
  { q: '会员可否参与跨国交流项目？', a: '符合项目条件的会员可报名参与，协会将依据项目目标与名额进行组织安排。' }
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
