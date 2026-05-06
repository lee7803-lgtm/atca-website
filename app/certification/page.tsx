import SiteHeader from '@/components/site-header';

const timeline = [
  '第 1-2 周：提交资料与资格预审',
  '第 3-6 周：课程研修与礼仪实践',
  '第 7-8 周：综合评核与专家面谈',
  '第 9 周：结果确认与证书签发'
];

const levels = [
  '初阶：道教文化基础与礼仪认知',
  '中阶：经典研读、法务协作与活动执行',
  '高阶：文化传播、教学辅导与社会服务实践'
];

export default function CertificationPage() {
  return (
    <main className="page-shell">
      <SiteHeader currentPath="/certification" />
      <section className="page-section space-y-12 fade-in">
        <h1 className="page-title">认证体系</h1>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">认证流程时间线</h2>
          <ol className="list-decimal space-y-2 pl-6 text-zinc-300">
            {timeline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">认证等级结构</h2>
          <ul className="list-disc space-y-2 pl-6 text-zinc-300">
            {levels.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">认证规范说明</h2>
          <p className="leading-relaxed text-zinc-300">
            协会认证以德行规范、学习过程、实践能力和社会服务为评估基础。当前页面为静态信息展示，具体执行细则由协会秘书处按年度发布与更新。
          </p>
        </article>
      </section>
    </main>
  );
}
