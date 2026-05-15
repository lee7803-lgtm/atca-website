import Link from "next/link";
import type { Metadata } from "next";
import { PrintButton } from "@/components/PrintButton";
import { findPublicCertificateByNo, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { CertificateQueryResult } from "@/types/certification";

export const dynamic = "force-dynamic";

const statusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  expired: "已过期",
  revoked: "已撤销",
  suspended: "已暂停"
};

export const metadata: Metadata = {
  title: "证书详情｜国际道教与文化协会 ITCA"
};

export default async function CertificateDetailPage({ params }: { params: { certificateNo: string } }) {
  let certificate: CertificateQueryResult | null = null;
  let message = "";
  const certificateNo = decodeURIComponent(params.certificateNo || "").trim();

  try {
    certificate = certificateNo ? await findPublicCertificateByNo(certificateNo) : null;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      message = `证书详情服务尚未完成数据库配置，缺少环境变量：${error.missing.join(", ")}。`;
    } else if (isSupabaseSchemaError(error)) {
      message = "证书数据表尚未配置。请先确认 Supabase 数据库结构。";
    } else if (error instanceof SupabaseRequestError) {
      message = "证书详情服务暂时无法访问数据库，请稍后重试。";
    } else {
      message = "证书详情服务暂时不可用，请稍后重试。";
    }
  }

  if (!certificate) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-8 text-center shadow-aureate">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Detail</p>
          <h1 className="mt-3 font-serif text-3xl text-porcelain">未查询到对应证书记录</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#5f5b52]">
            {message || "未查询到对应证书记录。请确认链接是否正确，或返回证书查询页重新核验。"}
          </p>
          <Link className="mt-7 inline-flex rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white" href="/certificate-query">
            返回证书查询页
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: #fff !important; }
          .certificate-print {
            box-shadow: none !important;
            border: 1px solid #b08a45 !important;
            margin: 0 auto !important;
            width: 190mm !important;
            min-height: 260mm !important;
            padding: 20mm !important;
          }
        }
      `}</style>

      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/certificate-query">
          返回证书查询页
        </Link>
        <PrintButton />
      </div>

      <section className="certificate-print rounded-2xl border border-[#d8d0bf] bg-[#fffdf8] p-8 text-center shadow-aureate sm:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-gold">ITCA</p>
        <p className="mt-3 text-sm tracking-[0.18em] text-[#8a6b3e]">国际道教与文化协会</p>
        <p className="mt-1 text-xs tracking-[0.12em] text-[#8a6b3e]">International Taoisme And Cultural Association</p>

        <div className="mx-auto my-8 h-px max-w-xl bg-[#d8d0bf]" />

        <h1 className="font-serif text-4xl leading-tight text-porcelain sm:text-5xl">道士资格认证证书</h1>
        <p className="mt-4 text-sm uppercase tracking-[0.26em] text-gold">Certificate of Taoist Qualification Certification</p>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left">
          <CertificateRow label="证书编号" value={certificate.certificateNo} />
          <CertificateRow label="姓名" value={certificate.holderName} />
          <CertificateRow label="认证类型" value={certificate.certificationType} />
          <CertificateRow label="签发机构" value={certificate.issuer} />
          <CertificateRow label="签发日期" value={certificate.issuedDate} />
          <CertificateRow label="证书状态" value={statusText[certificate.status] || certificate.status} />
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl gap-5 text-left sm:grid-cols-[1fr_9rem] sm:items-start">
          <div className="rounded-xl border border-[#e4ded0] bg-white/72 p-5 text-sm leading-8 text-[#5f5b52]">
            本页面用于核对 ITCA 登记系统中是否存在对应证书记录。查询结果用于确认该证书的登记状态、签发信息及当前有效状态。证书状态以 ITCA 官网核验结果为准。
          </div>
          <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-[#b08a45] bg-[#fbf8ef] p-4 text-center text-xs leading-6 text-[#8a6b3e]">
            二维码预留位
          </div>
        </div>

        <div className="no-print mx-auto mt-8 max-w-2xl rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          下载 / PDF 入口预留。本阶段支持浏览器打印，不自动生成 PDF。
        </div>
      </section>
    </main>
  );
}

function CertificateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-b border-[#e4ded0] pb-3 sm:grid-cols-[8rem_1fr]">
      <p className="text-sm font-medium text-[#8a6b3e]">{label}</p>
      <p className="break-all text-base leading-7 text-porcelain">{value}</p>
    </div>
  );
}
