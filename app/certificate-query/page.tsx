"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { IconBadge } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { maskName } from "@/lib/masking";
import type { CertificateQueryResponse, CertificateQueryResult } from "@/types/certification";

const statusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  expired: "已过期",
  revoked: "已撤销",
  suspended: "已暂停"
};

export default function CertificateQueryPage() {
  const [certificateNo, setCertificateNo] = useState("");
  const [holderName, setHolderName] = useState("");
  const [certificate, setCertificate] = useState<CertificateQueryResult | null>(null);
  const [message, setMessage] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const certificateNoParam = params.get("certificateNo");
    const holderNameParam = params.get("holderName");
    if (certificateNoParam) setCertificateNo(certificateNoParam);
    if (holderNameParam) setHolderName(holderNameParam);
  }, []);

  const submitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsQuerying(true);
    setMessage("");
    setCertificate(null);

    try {
      const params = new URLSearchParams({ certificateNo: certificateNo.trim(), holderName: holderName.trim() });
      const response = await fetch(`/api/certificates/query?${params.toString()}`);
      const result = (await response.json()) as CertificateQueryResponse;

      if (!response.ok || !result.success) {
        setMessage(result.success === false ? result.message : "证书查询未成功，请检查资料后重新查询。");
        return;
      }

      setCertificate(result.certificate);
    } catch {
      setMessage("证书查询服务暂时不可用，请稍后重试或联系协会秘书处。");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "查询证书", href: "/certificate-query" },
          { label: "申请进度查询", href: "/application/query" }
        ]}
        eyebrow="Certificate Query"
        imageSrc="/images/itca/05-service-verification.png"
        intro="证书查询用于公众核验 ITCA 道士资格认证公开证书信息，查询结果仅展示公开核验所需内容。"
        subtitle="Certificate Verification And Query"
        title="证书查询"
        visualDescription="通过证书编号与持证人姓名核验证书状态，证书状态以官网核验结果为准。"
        visualEyebrow="Certificate Verify"
        visualMark="Verify"
        visualSeal="核验"
        visualTitle="证书查询核验"
      />

      <Section eyebrow="Query" title="证书查询" afterHero>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form className="rounded-2xl border border-[#d8d0bf] bg-white/92 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <div className="mb-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
              <p className="mb-3">请输入证书编号与持证人姓名，用于核验公开证书信息。查询结果不展示申请编号、联系方式、上传材料、审核反馈或内部备注。</p>
              <p>已提交认证申请，想查询审核或发证进度？</p>
              <Link className="mt-3 inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" href="/application/query">
                返回申请进度查询
              </Link>
            </div>
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-porcelain">证书编号</span>
                <input className="form-input" placeholder="ITCA-TAO-********" required value={certificateNo} onChange={(event) => setCertificateNo(event.target.value)} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-porcelain">姓名</span>
                <input className="form-input" required value={holderName} onChange={(event) => setHolderName(event.target.value)} />
              </label>
            </div>
            {message ? <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]">{message}</div> : null}
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isQuerying} type="submit">
              {isQuerying ? "正在查询..." : "查询证书记录"}
            </button>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-6 shadow-aureate sm:p-8">
            <IconBadge name="certificate" />
            <h2 className="mt-4 font-serif text-2xl text-porcelain">查询结果</h2>
            {certificate ? (
              <div className="mt-6 grid gap-3">
                <ResultRow label="证书编号" value={certificate.certificateNo} />
                <ResultRow label="姓名" value={maskName(certificate.holderName)} />
                <ResultRow label="认证类型" value={certificate.certificationType} />
                <ResultRow label="签发机构" value={certificate.issuer} />
                <ResultRow label="签发日期" value={certificate.issuedDate} />
                <ResultRow label="证书状态" value={statusText[certificate.status]} />
                <ResultRow label="核验说明" value="本页面用于核对 ITCA 登记系统中是否存在对应证书记录。查询结果用于确认该证书的登记状态、签发信息及当前有效状态。证书状态以 ITCA 官网核验结果为准。" />
                <div className="mt-2">
                  <Link className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" href={certificate.detailUrl}>
                    查看公开核验详情
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#666666]">请输入证书编号与姓名后查询。若查询不到记录，请确认姓名和证书编号是否与证书登记信息一致，或联系 ITCA 进行核对。</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="证书核验说明" tone="soft">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          本页面用于核对 ITCA 登记系统中是否存在对应证书记录。查询结果用于确认该证书的公开登记状态、签发信息及当前有效状态。证书状态以 ITCA 官网核验结果为准。
        </div>
      </Section>
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3 sm:grid-cols-[9rem_1fr]">
      <p className="text-sm font-medium text-porcelain">{label}</p>
      <p className="text-sm leading-6 text-[#666666]">{value}</p>
    </div>
  );
}
