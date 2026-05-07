import SiteHeader from '@/components/layout/site-header';

export default function CertificateQueryPage() {
  return (
    <main className="page-shell">
      <SiteHeader currentPath="/certificate-query" />
      <section className="page-section space-y-12 fade-in">
        <h1 className="page-title">证书查询</h1>

        <article className="content-card">
          <form className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">证书编号</label>
              <input
                className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-gold/70"
                placeholder="请输入证书编号"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">姓名</label>
              <input
                className="w-full rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-gold/70"
                placeholder="请输入姓名"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                className="primary-btn"
              >
                查询（静态示例）
              </button>
            </div>
          </form>
        </article>

        <article className="content-card">
          <h2 className="mb-4 text-2xl text-amber">查询说明</h2>
          <p className="leading-relaxed text-zinc-300">
            请输入证书编号与姓名后提交查询。当前页面为静态演示，不连接数据库，也不提供实时返回结果。
          </p>
          <p className="mt-4 text-zinc-300">
            静态提示：当前为人工核验流程，提交后由协会秘书处核对，并在工作日内通过预留联系方式回复查询结果。
          </p>
        </article>
      </section>
    </main>
  );
}
