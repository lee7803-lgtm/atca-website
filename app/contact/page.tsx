import SiteHeader from '@/components/layout/site-header';

export default function ContactPage() {
  return (
    <main className="page-shell">
      <SiteHeader currentPath="/contact" />
      <section className="page-section space-y-12 fade-in">
        <h1 className="page-title">联系我们</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <article className="content-card">
            <h2 className="mb-4 text-2xl text-amber">联系表单</h2>
            <form className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">姓名</label>
                <input className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-gold/70" placeholder="请输入姓名" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">邮箱</label>
                <input className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-gold/70" placeholder="请输入邮箱" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">留言内容</label>
                <textarea className="h-32 w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-gold/70" placeholder="请输入咨询内容" />
              </div>
              <button type="button" className="primary-btn">提交（静态示例）</button>
            </form>
          </article>

          <article className="content-card">
            <h2 className="mb-4 text-2xl text-amber">联系方式与合作咨询</h2>
            <div className="space-y-3 text-zinc-300">
              <p>邮箱：contact@atca.org（占位）</p>
              <p>WhatsApp：+65 9000 0000（占位）</p>
              <p>地址：东盟文化交流中心 1 号楼（占位）</p>
            </div>
          </article>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="content-card">
            <h3 className="mb-3 text-xl text-amber">国际合作说明</h3>
            <p className="leading-relaxed text-zinc-300">欢迎国际文化机构、研究中心与基金会发起联合项目，协会将根据合作方向匹配学术与执行团队，推进长期协作。</p>
          </article>
          <article className="content-card">
            <h3 className="mb-3 text-xl text-amber">课程合作说明</h3>
            <p className="leading-relaxed text-zinc-300">可与高校、社区及教育机构开展课程共建，内容包括礼仪训练、经典导读、文化传播与师资发展支持。</p>
          </article>
          <article className="content-card">
            <h3 className="mb-3 text-xl text-amber">学术交流说明</h3>
            <p className="leading-relaxed text-zinc-300">协会支持学术论坛、课题协作与成果发布，鼓励跨学科研究与国际对话，推动道家文化研究的专业深化。</p>
          </article>
        </div>
      </section>
    </main>
  );
}
