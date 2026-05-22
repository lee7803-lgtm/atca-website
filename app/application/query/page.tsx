"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { maskApplicationNo, maskName } from "@/lib/masking";
import { certificationPathLabels } from "@/types/certification";
import type { ApplicationQueryResponse, ApplicationQueryResult } from "@/types/application";

const statusText: Record<string, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  under_review: "审核中",
  need_more_info: "需补充材料",
  approved: "审核通过",
  rejected: "审核未通过",
  archived: "已归档",
  certificate_issued: "已生成证书",
  cert_issued: "已生成证书",
  delivered: "已下发",
  revoked: "已撤销"
};

const deliveryStatusText: Record<string, string> = {
  not_delivered: "待下发",
  delivered: "已下发"
};

const certificateStatusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  revoked: "已撤销",
  expired: "已过期"
};

const typeText: Record<string, string> = {
  personal_member: "个人会员申请",
  organization_member: "机构会员申请",
  taoist_certification: "道士资格认证申请"
};

export default function ApplicationQueryPage() {
  return (
    <Suspense fallback={<QueryPageFallback />}>
      <ApplicationQueryContent />
    </Suspense>
  );
}

function ApplicationQueryContent() {
  const searchParams = useSearchParams();
  const [applicationNumber, setApplicationNumber] = useState(searchParams.get("number") || "");
  const [contact, setContact] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [applications, setApplications] = useState<ApplicationQueryResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedApplication = applications[selectedIndex] || null;

  const submitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isQuerying) return;

    setIsQuerying(true);
    setErrorMessage("");
    setApplications([]);
    setSelectedIndex(0);

    try {
      const params = new URLSearchParams({ mode: "number", applicationNo: applicationNumber.trim(), contact: contact.trim() });

      const response = await fetch(`/api/applications/query?${params.toString()}`);
      const result = (await response.json()) as ApplicationQueryResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.success === false ? result.message : "申请查询未成功，请检查资料后重新查询。");
        return;
      }

      setApplications(result.applications);
    } catch {
      setErrorMessage("申请查询服务暂时不可用，请稍后重试或联系协会秘书处。");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "申请进度查询", href: "/application/query" },
          { label: "证书公开核验", href: "/certificate-query" }
        ]}
        eyebrow="Application Query"
        title="申请进度 / 申请结果查询"
        subtitle="Application Status And Result Query"
        intro="本页面供申请人本人查询认证申请进度、审核反馈、证书生成情况、证书查看与打印入口。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="查询结果仅脱敏显示申请状态和必要备注，不公开完整申请资料。"
        visualEyebrow="Query"
        visualMark="Status"
        visualSeal="查询"
        visualTitle="申请结果查询"
      />

      <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
        <section className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Query Form</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询申请记录</h2>
            <p className="mt-4 text-sm leading-7 text-[#5f5b52]">请输入申请编号，以及提交申请时使用的邮箱或手机 / WhatsApp，用于核对本人申请进度、申请结果、审核反馈、证书生成状态与证书查看 / 打印信息。</p>

            <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#666666]">
              申请编号在证书核发后不失效，仍可用于申请人本人查询申请结果和证书查看与打印信息。公众证书公开核验请使用证书编号与持证人姓名。
            </div>

            <div className="mt-7 grid gap-5">
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">申请编号 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" placeholder="例如 ITCA-M-2026-000001" required value={applicationNumber} onChange={(event) => setApplicationNumber(event.target.value)} />
              </label>
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">邮箱或手机 / WhatsApp <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" placeholder="请输入提交申请时填写的联络方式" required value={contact} onChange={(event) => setContact(event.target.value)} />
              </label>
            </div>

            {errorMessage ? <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">{errorMessage}</div> : null}
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isQuerying} type="submit">
              {isQuerying ? "正在查询..." : "查询申请进度 / 结果"}
            </button>
            <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#666666]">
              支持 ITCA-M、ITCA-O、ITCA-TAO 开头的申请编号。查询结果仅用于申请人本人查看，不展示后台内部备注、后台操作记录或其他申请人的资料。
            </div>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Status</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询结果</h2>
            {applications.length > 1 ? (
              <div className="mt-6 grid gap-3">
                <p className="text-sm leading-7 text-[#5f5b52]">查询到多条匹配记录，请选择一条查看脱敏详情。</p>
                {applications.map((item, index) => (
                  <button className={`rounded-2xl border px-4 py-3 text-left text-sm ${selectedIndex === index ? "border-[#7F1D1D] bg-white text-[#7F1D1D]" : "border-[#e4ded0] bg-white/70 text-[#5f5b52]"}`} key={item.applicationNo} onClick={() => setSelectedIndex(index)} type="button">
                    {maskApplicationNo(item.applicationNo)} · {typeText[item.applicationType]} · {maskName(item.name)} · {statusText[item.status]}
                  </button>
                ))}
              </div>
            ) : null}
            {selectedApplication ? (
              <div className="mt-7 grid gap-4">
                <StatusRow label="申请编号" value={selectedApplication.applicationNo} />
                <StatusRow label="申请类型" value={typeText[selectedApplication.applicationType]} />
                <StatusRow label="申请人 / 机构名称" value={maskName(selectedApplication.name)} />
                <StatusRow label="当前状态" value={currentStatusText(selectedApplication)} />
                <StatusRow label="提交时间" value={formatDateTime(selectedApplication.createdAt)} />
                <StatusRow label={selectedApplication.applicationType === "taoist_certification" ? "对申请人的反馈" : "审核反馈"} value={selectedApplication.adminNote || "暂无反馈"} />
                {selectedApplication.applicationType === "taoist_certification" ? (
                  <>
                    <StatusRow label="是否需要补充材料" value={selectedApplication.status === "need_more_info" ? "是，请查看反馈说明" : "否"} />
                    <StatusRow label="证书是否已生成" value={selectedApplication.certificateNo ? "是" : "否"} />
                    <StatusRow label="证书下发状态" value={deliveryStatusText[selectedApplication.deliveryStatus || "not_delivered"]} />
                    <StatusRow label="下发时间" value={selectedApplication.deliveredAt ? formatDateTime(selectedApplication.deliveredAt) : "尚未下发"} />
                  </>
                ) : null}
                <StatusRow label="下一步提示" value={nextStepText(selectedApplication.status)} />
                {selectedApplication.certificateNo ? (
                  <div className="border-b border-[#e4ded0] pb-4 last:border-b-0">
                    <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">证书编号</p>
                    <p className="mt-2 break-all text-sm leading-7 text-porcelain">{selectedApplication.certificateNo}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink" href={selectedApplication.certificateDetailUrl || `/certificates/${encodeURIComponent(selectedApplication.certificateNo)}`}>
                        查看证书公开核验
                      </a>
                    </div>
                  </div>
                ) : null}
                {selectedApplication.certificateNo ? <ApplicantCertificatePrint application={selectedApplication} /> : null}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-[#e4ded0] bg-white/74 p-5 text-sm leading-8 text-[#5f5b52]">
                <p className="font-medium text-porcelain">暂无查询结果</p>
                <p className="mt-2">请填写申请编号，以及提交申请时使用的邮箱或手机 / WhatsApp。若查询不到结果，请确认申请编号和联系方式是否与提交申请时一致，或联系协会秘书处协助核对。</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Status</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">状态说明</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {["已提交", "待审核", "审核中", "需补充材料", "审核通过", "审核未通过", "已生成证书", "已下发", "已归档", "已撤销"].map((item) => (
                <span className="rounded-full border border-[#e4ded0] bg-[#fbf8ef] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Notice</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">证书说明</h2>
            <p className="mt-5">申请人可通过本页查看申请状态、申请结果和证书生成情况。证书编号用于公众公开核验；申请编号用于申请人本人查询。</p>
          </div>
        </section>
      </main>
    </>
  );
}

function nextStepText(status: string) {
  if (status === "submitted") return "申请已提交，请等待秘书处审核。";
  if (status === "pending_review") return "您的申请已进入待审核队列，请等待秘书处处理。";
  if (status === "under_review") return "申请正在审核中，请等待秘书处审核。";
  if (status === "need_more_info") return "请根据反馈内容准备补充材料，并联系协会秘书处处理。本阶段不提供在线补充材料上传。";
  if (status === "approved") return "申请已通过，等待生成证书或完成发证流程。";
  if (status === "certificate_issued" || status === "cert_issued") return "证书已生成，可查看证书编号、证书状态、证书查看与打印区和公开核验入口。";
  if (status === "delivered") return "证书已下发，仍可查看证书信息和公开核验入口。";
  if (status === "rejected") return "您的申请未通过审核，请查看反馈说明。";
  if (status === "archived") return "申请已归档，如需进一步核验请联系协会秘书处。";
  if (status === "revoked") return "该记录已撤销，如需核对请联系协会秘书处。";
  return "请等待秘书处审核；如联系方式变更，请主动联系更新。";
}

function currentStatusText(application: ApplicationQueryResult) {
  if (application.applicationType === "taoist_certification" && application.status === "approved" && !application.certificateNo) return "已通过，待生成证书";
  if (application.applicationType === "taoist_certification" && (application.status === "certificate_issued" || application.status === "cert_issued") && application.certificateNo) return "审核已通过，证书记录已生成";
  if (application.applicationType === "taoist_certification" && application.status === "delivered" && application.certificateNo) return "证书记录已生成并已下发";
  return statusText[application.status];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDate(value?: string) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function printCertificateArea() {
  const element = document.getElementById("applicant-certificate-print");
  if (!element) return;
  const printWindow = window.open("", "_blank", "width=920,height=1100");
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>证书查看与打印</title>
        <style>
          body { margin: 0; padding: 28px; color: #273331; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; }
          .no-print { display: none !important; }
          img { max-width: 160px; max-height: 220px; object-fit: contain; }
          .print-grid { display: grid; grid-template-columns: 170px 1fr; gap: 24px; align-items: start; }
          .print-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; }
          @page { margin: 18mm; }
        </style>
      </head>
      <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

function ApplicantCertificatePrint({ application }: { application: ApplicationQueryResult }) {
  const verificationUrl = application.certificateNo ? `/certificates/${encodeURIComponent(application.certificateNo)}` : "";

  return (
    <section className="mt-4 rounded-2xl border border-[#d8d0bf] bg-[#fffdf8] p-5 shadow-aureate sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certificate Print</p>
          <h3 className="mt-2 font-serif text-2xl text-porcelain">证书查看与打印</h3>
          <p className="mt-2 text-sm leading-7 text-[#5f5b52]">本区域仅供申请人本人查看和通过浏览器打印，不作为公众核验页面。</p>
        </div>
        <button className="no-print rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)]" onClick={printCertificateArea} type="button">
          浏览器打印
        </button>
      </div>
      <div id="applicant-certificate-print" className="rounded-xl border border-[#e4ded0] bg-white p-5 sm:p-7">
        <div className="mb-6 border-b border-[#e4ded0] pb-5 text-center">
          <p className="text-xs tracking-[0.28em] text-gold">ITCA / 国际道教与文化协会</p>
          <h4 className="mt-3 font-serif text-3xl leading-tight text-porcelain">道士资格认证证书信息</h4>
          <p className="mt-2 text-sm leading-7 text-[#5f5b52]">Taoist Qualification Certification Record</p>
        </div>
        <div className="print-grid grid gap-6 md:grid-cols-[10.5rem_1fr] md:items-start">
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-center">
            <p className="mb-3 text-xs tracking-[0.18em] text-[#8a6b3e]">道装证件照</p>
            {application.certificatePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Applicant-only signed URL preview returned after application/contact verification.
              <img alt="道装证件照" className="mx-auto max-h-56 rounded-lg border border-[#e4ded0] bg-white object-contain" src={application.certificatePhotoUrl} />
            ) : (
              <p className="grid min-h-40 place-items-center text-xs leading-6 text-[#8a6b3e]">
                {application.certificatePhotoRecorded ? "证书照片已记录，如需核验请联系协会秘书处" : "暂未记录证书照片"}
              </p>
            )}
          </div>
          <div>
            <div className="print-fields grid gap-3 sm:grid-cols-2">
              <CertificateField label="证书编号" value={application.certificateNo || "未生成"} />
              <CertificateField label="持证人姓名" value={application.certificateHolderName || application.name} />
              <CertificateField label="道名" value={application.certificateTaoistName || "未记录"} />
              <CertificateField label="传承体系" value={application.certificationPath ? certificationPathLabels[application.certificationPath] : "未记录"} />
              <CertificateField label="认证等级" value={application.certificationLevel || "未记录"} />
              <CertificateField label="所属道派 / 法脉 / 宫观" value={application.certificateLineageOrTemple || "未记录"} />
              <CertificateField label="签发机构" value={application.certificateIssuer || "ITCA / 国际道教与文化协会"} />
              <CertificateField label="签发日期" value={formatDate(application.certificateIssuedDate)} />
              <CertificateField label="有效期" value={`${formatDate(application.certificateValidFrom)} 至 ${formatDate(application.certificateValidUntil)}`} />
              <CertificateField label="证书状态" value={certificateStatusText[application.certificateStatus || "pending"] || "待确认"} />
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-dashed border-[#b08a45] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          <p className="break-all">证书公开核验入口：{verificationUrl}</p>
          <p className="mt-2">认证范围说明：本认证属于协会认证与文化传承体系内的资格备案和身份记录，不等同于任何国家或地区政府机关颁发的法定职业资格、行政许可、宗教任命或执业许可。</p>
        </div>
      </div>
    </section>
  );
}

function CertificateField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#eee7da] pb-3">
      <p className="text-xs tracking-[0.18em] text-[#8a6b3e]">{label}</p>
      <p className="mt-1 break-all text-sm leading-6 text-porcelain">{value}</p>
    </div>
  );
}

function QueryPageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
      <section className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Query</p>
          <h1 className="mt-3 font-serif text-3xl text-porcelain">申请进度 / 申请结果查询</h1>
          <p className="mt-4 text-sm leading-8 text-[#5f5b52]">用于申请人通过申请编号和登记联系方式查询个人会员申请、机构会员申请、道士资格认证申请、证书生成情况及证书查看与打印信息。</p>
          <div className="mt-7 grid gap-5">
            <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
              <span className="text-sm font-medium text-porcelain">申请编号</span>
              <input className="form-input" placeholder="例如 ITCA-M-2026-000001" readOnly />
            </label>
            <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
              <span className="text-sm font-medium text-porcelain">邮箱或手机 / WhatsApp</span>
              <input className="form-input" placeholder="请输入提交申请时填写的联络方式" readOnly />
            </label>
          </div>
          <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white" type="button">
            查询申请进度 / 结果
          </button>
        </div>
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Status</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询结果</h2>
          <div className="mt-7 rounded-2xl border border-[#e4ded0] bg-white/74 p-5 text-sm leading-8 text-[#5f5b52]">
            <p className="font-medium text-porcelain">暂无查询结果</p>
            <p className="mt-2">请填写申请编号和提交申请时使用的联系方式。若查询不到结果，请确认填写信息是否与提交申请时一致，或联系协会秘书处协助核对。</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#e4ded0] pb-4 last:border-b-0">
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}
