import Link from "next/link";
import type { Metadata } from "next";
import { findPublicCertificateByNo, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import { certificationPathLabels, type CertificateQueryResult } from "@/types/certification";

export const dynamic = "force-dynamic";

const statusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  expired: "已过期",
  revoked: "已撤销"
};

export const metadata: Metadata = {
  title: "证书公开核验详情｜国际道教与文化协会 ITCA"
};

export default async function CertificateDetailPage({ params }: { params: { certificateNo: string } }) {
  let certificate: CertificateQueryResult | null = null;
  let message = "";
  const certificateNo = decodeURIComponent(params.certificateNo || "").trim();

  try {
    certificate = certificateNo ? await findPublicCertificateByNo(certificateNo) : null;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      message = "证书公开核验详情服务尚未完成系统配置，请联系协会秘书处核验。";
    } else if (isSupabaseSchemaError(error)) {
      message = "证书公开核验资料尚未完成系统配置，请联系协会秘书处核验。";
    } else if (error instanceof SupabaseRequestError) {
      message = "证书公开核验详情服务暂时无法访问数据库，请稍后重试。";
    } else {
      message = "证书公开核验详情服务暂时不可用，请稍后重试。";
    }
  }

  if (!certificate) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-8 text-center shadow-aureate">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Verification Detail</p>
          <h1 className="mt-3 font-serif text-3xl text-porcelain">未查询到对应公开核验记录</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#5f5b52]">
            {message || "未查询到对应公开证书记录。请确认链接是否正确，或返回证书公开核验页重新核验。"}
          </p>
          <Link className="mt-7 inline-flex rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white" href="/certificate-query">
            返回证书公开核验页
          </Link>
          <Link className="mt-3 inline-flex rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink" href="/application/query">
            返回申请查询
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/application/query">
          返回申请查询
        </Link>
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/certificate-query">
          返回证书公开核验
        </Link>
      </div>
      <div className="no-print mb-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
        本页面仅展示证书公开核验信息，用于确认该证书是否为 ITCA / 国际道教与文化协会记录在册的认证信息。公开核验信息不等同于证书原件，也不展示申请人的联系方式、上传材料、审核意见或后台审核备注。
      </div>

      <section className="rounded-2xl border border-[#d8d0bf] bg-[#fffdf8] p-8 text-center shadow-aureate sm:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-gold">ITCA</p>
        <p className="mt-3 text-sm tracking-[0.18em] text-[#8a6b3e]">国际道教与文化协会</p>
        <p className="mt-1 text-xs tracking-[0.12em] text-[#8a6b3e]">ITCA Public Certificate Verification</p>

        <div className="mx-auto my-8 h-px max-w-xl bg-[#d8d0bf]" />

        <h1 className="font-serif text-4xl leading-tight text-porcelain sm:text-5xl">证书公开核验详情</h1>
        <p className="mt-4 text-sm uppercase tracking-[0.26em] text-gold">Public Certificate Verification Result</p>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left">
          <CertificateRow label="证书编号" value={certificate.certificateNo} />
          <CertificateRow label="持证人姓名" value={certificate.holderName} />
          <CertificateRow label="认证类别" value={certificate.certificationType} />
          <CertificateRow label="传承体系" value={certificate.certificationPath ? certificationPathLabels[certificate.certificationPath] : "未公开"} />
          <CertificateRow label="认证等级" value={certificate.certificationLevel} />
          <CertificateRow label="签发机构" value={certificate.issuer} />
          <CertificateRow label="签发日期" value={certificate.issuedDate} />
          <CertificateRow label="有效期" value={`${certificate.validFrom || "未记录"} 至 ${certificate.validUntil || "未记录"}`} />
          <CertificateRow label="证书状态" value={statusText[certificate.status] || certificate.status} />
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl gap-5 text-left">
          <div className="rounded-xl border border-[#e4ded0] bg-white/72 p-5 text-sm leading-8 text-[#5f5b52]">
            <p>核验说明：本页面用于确认该证书是否为 ITCA / 国际道教与文化协会记录在册的认证信息。证书状态以官网公开核验结果为准。</p>
            <p className="mt-3">认证范围说明：本认证属于协会认证与文化传承体系内的资格备案和身份记录，不具备政府机关行政许可、职业准入或宗教职务任命效力。</p>
          </div>
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
