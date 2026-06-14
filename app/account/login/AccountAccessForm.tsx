import Link from "next/link";

export function AccountAccessForm() {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <article className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <h2 className="font-serif text-2xl text-porcelain">账号服务状态</h2>
        <p className="mt-3 text-sm leading-7 text-[#5f5b52]">
          账号服务正在建设中。开放后，会员、认证申请人和机构账号可在用户中心集中查看相关记录。
        </p>
        <Link className="mt-6 inline-flex rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)]" href="/application/query">
          先查询申请进度
        </Link>
      </article>

      <article className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
        <h2 className="font-serif text-2xl text-porcelain">当前可用业务路径</h2>
        <p className="mt-3 text-sm leading-7 text-[#5f5b52]">
          现阶段可直接使用个人会员申请、机构会员申请和认证申请入口提交资料；公开查询请进入查询核验频道。
        </p>
        <Link className="mt-6 inline-flex rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href="/membership">
          查看会员体系
        </Link>
      </article>
    </div>
  );
}
