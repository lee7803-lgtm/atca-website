import Link from "next/link";
import type { Metadata } from "next";
import { getCertificateDetail } from "@/lib/api/certificates";
import { certificationPathLabels, type CertificateQueryResult } from "@/types/certification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "证书核验详情｜国际道教与文化协会 ITCA"
};

type CertificateDetailPageProps = {
  params: {
    certificateNo: string;
  };
  searchParams?: {
    vt?: string | string[];
  };
};

const statusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  expired: "已过期",
  revoked: "已撤销",
  suspended: "已暂停",
  expiring_soon: "即将到期",
  pending_renewal: "待续期",
  renewal_in_progress: "续期中",
  renewed: "已续期",
  validity_not_set: "有效期未设置"
};

export default async function CertificateDetailPage({ params, searchParams }: CertificateDetailPageProps) {
  const certificateNo = decodeURIComponent(params.certificateNo);
  const verificationToken = getSearchParam(searchParams?.vt);
  const detail = await getCertificateDetail(certificateNo, verificationToken);

  if (detail.status !== "found") {
    return <ProtectedPrompt message={detail.message} />;
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
      <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Verification</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">证书核验详情</h1>
        <p className="mt-5 max-w-2xl text-sm leading-8 text-[#5f5b52]">
          本页仅展示公开证书核验字段。公开核验信息用于确认该证书是否为 ITCA / 国际道教与文化协会记录在册的认证信息，不等同于证书原件。
        </p>

        <div className="mt-8 grid gap-3">
          <DetailRow label="证书编号" value={detail.certificate.certificateNo} />
          <DetailRow label="持证人姓名" value={detail.certificate.holderName} />
          <DetailRow label="认证类型" value={detail.certificate.certificationType} />
          <DetailRow label="认证路径 / 等级" value={formatPathAndLevel(detail.certificate)} />
          <DetailRow label="签发机构" value={detail.certificate.issuer} />
          <DetailRow label="签发日期" value={detail.certificate.issuedDate || "未记录"} />
          <DetailRow label="有效期开始" value={detail.certificate.validFrom || "有效期未设置"} />
          <DetailRow label="有效期截止" value={detail.certificate.validUntil || "有效期未设置"} />
          <DetailRow label="统一状态" value={detail.certificate.effectiveStatusLabel || statusText[detail.certificate.effectiveStatus || detail.certificate.status] || detail.certificate.status} />
          <DetailRow label="核验说明" value="该短期核验链接由证书编号与持证人姓名完成核验后生成，有效期内可查看公开证书详情。" />
        </div>

        <Link className="mt-8 inline-flex w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D] sm:w-auto" href="/certificate-query">
          返回证书核验
        </Link>
      </section>
    </main>
  );
}

function ProtectedPrompt({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
      <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-center shadow-aureate sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Verification</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">请先完成证书核验</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#5f5b52]">
          {message || "请先完成证书核验。为保护持证人信息，请返回证书查询页面，输入证书编号与持证人姓名进行核验。"}
        </p>
        <Link className="mt-7 inline-flex w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] sm:w-auto" href="/certificate-query">
          前往证书核验
        </Link>
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-xl border border-[#e4ded0] bg-[#f8f7f3] px-4 py-3 sm:grid-cols-[10rem_1fr]">
      <p className="text-sm font-medium text-porcelain">{label}</p>
      <p className="break-words text-sm leading-6 text-[#5f5b52]">{value}</p>
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function formatPathAndLevel(certificate: CertificateQueryResult) {
  const path = certificate.certificationPath ? certificationPathLabels[certificate.certificationPath] : "";
  const level = certificate.certificationLevel || "";

  return [path, level].filter(Boolean).join(" / ") || "未公开";
}
