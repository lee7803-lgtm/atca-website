import SiteHeader from '@/components/layout/site-header';

const timeline = [
  '第 1 阶段：提交申请资料并完成资格预审',
  '第 2 阶段：参加课程研修与礼仪实践训练',
  '第 3 阶段：完成综合评核与专家面谈',
  '第 4 阶段：秘书处复核并发布认证结果'
];

const levels = [
  '初阶认证：道教基础知识、礼仪规范与学习态度评估',
  '中阶认证：经典理解、活动执行与协作能力评估',
  '高阶认证：教学传播、社会服务与专业影响力评估'
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
            认证工作遵循公开、公平、可追溯原则，重点评估申请者的德行规范、学习过程、实践成果与社会服务表现。
            当前页面为静态展示，不涉及在线审核与自动判定功能。
          </p>
        </article>
      </section>
    </main>
  );
}
