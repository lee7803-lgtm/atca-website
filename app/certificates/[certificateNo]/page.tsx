import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "请通过证书查询页完成核验｜国际道教与文化协会 ITCA"
};

export default function CertificateDetailPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
      <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-8 text-center shadow-aureate sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Verification</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">请通过证书查询页完成核验</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#5f5b52]">
          为保护申请人与证书信息安全，证书核验需通过证书编号与持证人姓名共同验证。请前往证书查询页完成核验。
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-[#5f5b52]">
          后续如开放独立核验详情页，将改为随机 token、短期 token 或授权核验链接机制。
        </p>
        <Link className="mt-7 inline-flex rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certificate-query">
          前往证书查询
        </Link>
      </section>
    </main>
  );
}
