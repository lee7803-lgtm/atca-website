"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { IconBadge } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { queryPublicCertificate } from "@/lib/api/certificates";
import { maskName } from "@/lib/masking";
import { certificationPathLabels, type CertificateQueryResult } from "@/types/certification";

const statusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  expired: "已过期",
  revoked: "已撤销"
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
      const { response, result } = await queryPublicCertificate(certificateNo, holderName);

      if (!response.ok || !result.success) {
        setMessage(result.success === false ? result.message : "证书公开核验未成功，请检查资料后重新查询。");
        return;
      }

      setCertificate(result.certificate);
    } catch {
      setMessage("证书公开核验服务暂时不可用，请稍后重试或联系协会秘书处。");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "证书公开核验", href: "/certificate-query" },
          { label: "会员公开核验", href: "/member-query" },
          { label: "申请查询", href: "/application/query" }
        ]}
        eyebrow="Certificate Verification"
        backgroundImageSrc="/images/atca/certificate-verification.jpg"
        backgroundImagePosition="center 50%"
        imageSrc="/images/itca/05-service-verification.png"
        intro="证书公开核验面向公众、合作方及第三方机构，用于核验证书是否已纳入 ITCA / 国际道教与文化协会认证备案记录，以及当前证书状态是否有效。"
        subtitle="Public Certificate Verification"
        title="证书公开核验"
        visualDescription="通过证书编号与持证人姓名核验证书公开信息。本页面不能查询申请进度，不提供证书打印，也不展示道装证件照。"
        visualEyebrow="Certificate Verify"
        visualMark="Verify"
        visualSeal="核验"
        visualTitle="证书公开核验"
      />

      <Section eyebrow="Query" title="证书公开核验" afterHero>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <form className="rounded-2xl border border-[#d8d0bf] bg-white/92 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <div className="mb-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
              <p className="mb-3">请输入证书编号与持证人姓名，用于核验公开证书信息。核验结果不展示道装证件照、申请编号、联系方式、上传材料、审核反馈或后台审核备注。</p>
              <p>本页面不能查询申请进度，也不提供证书打印。申请人如需查询申请进度、申请结果或查看 / 打印证书，请前往申请查询。</p>
              <Link className="mt-3 inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" href="/application/query">
                前往申请查询
              </Link>
              <Link className="mt-3 inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink sm:ml-3" href="/member-query">
                前往会员公开核验
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
              {isQuerying ? "正在核验..." : "核验公开记录"}
            </button>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#f8f7f3] p-6 shadow-aureate sm:p-8">
            <IconBadge name="certificate" />
            <h2 className="mt-4 font-serif text-2xl text-porcelain">核验结果</h2>
            {certificate ? (
              <div className="mt-6 grid gap-3">
                <ResultRow label="证书编号" value={certificate.certificateNo} />
                <ResultRow label="姓名" value={maskName(certificate.holderName)} />
                <ResultRow label="认证类型" value={certificate.certificationType} />
                <ResultRow label="传承体系" value={certificate.certificationPath ? certificationPathLabels[certificate.certificationPath] : "未公开"} />
                <ResultRow label="认证等级" value={certificate.certificationLevel} />
                <ResultRow label="签发机构" value={certificate.issuer} />
                <ResultRow label="签发日期" value={certificate.issuedDate} />
                <ResultRow label="有效期" value={`${certificate.validFrom || "未记录"} 至 ${certificate.validUntil || "未记录"}`} />
                <ResultRow label="证书状态" value={statusText[certificate.status]} />
                <ResultRow label="核验说明" value="本页面用于确认该证书是否为 ITCA / 国际道教与文化协会记录在册的认证信息。公开核验信息不等同于证书原件。" />
                <div className="mt-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3 text-sm leading-7 text-[#5f5b52]">
                  公开核验结果已在本页展示。为保护申请人与证书信息安全，独立核验详情页后续将改为随机 token、短期 token 或授权核验链接机制。
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#666666]">请输入证书编号与持证人姓名后查询。若查询不到记录，请确认姓名和证书编号是否与证书登记信息一致，或联系 ITCA / 国际道教与文化协会进行核对。</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="核验说明" tone="soft">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          本页面仅展示证书公开核验信息，不展示道装证件照，不提供证书打印或下载。认证范围说明：本认证属于协会认证与文化传承体系内的资格备案和身份记录，不具备政府机关行政许可、职业准入或宗教职务任命效力。
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
