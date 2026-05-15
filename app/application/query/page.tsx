"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { maskApplicationNo, maskName } from "@/lib/masking";
import type { ApplicationQueryResponse, ApplicationQueryResult } from "@/types/application";

type QueryMode = "number" | "forgot";
type QueryType = "personal_member" | "organization_member" | "taoist_certification";

const statusText: Record<string, string> = {
  submitted: "已提交",
  pending_review: "审核中",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  archived: "已建档",
  certificate_issued: "已生成证书",
  cert_issued: "已发证",
  delivered: "已下发",
  revoked: "已撤销"
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
  const [mode, setMode] = useState<QueryMode>("number");
  const [applicationType, setApplicationType] = useState<QueryType>("personal_member");
  const [applicationNumber, setApplicationNumber] = useState(searchParams.get("number") || "");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [taoistName, setTaoistName] = useState("");
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
      const params = new URLSearchParams({ mode, contact: contact.trim() });

      if (mode === "number") {
        params.set("applicationNo", applicationNumber.trim());
      } else {
        params.set("applicationType", applicationType);
        params.set("name", name.trim());
        if (applicationType === "organization_member") params.set("contactName", contactName.trim());
        if (applicationType === "taoist_certification") params.set("taoistName", taoistName.trim());
      }

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
          { label: "证书查询", href: "/certificate-query" }
        ]}
        eyebrow="Application Query"
        title="申请进度查询"
        subtitle="Application Status Query"
        intro="申请进度查询用于查看资料受理、审核状态与后续办理结果，服务申请人与协会秘书处沟通确认。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="查询结果仅脱敏显示申请状态和必要备注，不公开完整申请资料。"
        visualEyebrow="Query"
        visualMark="Status"
        visualSeal="查询"
        visualTitle="申请进度查询"
      />

      <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
        <section className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Query Form</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询申请记录</h2>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-1.5">
              <button className={mode === "number" ? "rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#7F1D1D] shadow-sm" : "rounded-xl px-4 py-2.5 text-sm font-medium text-[#66594d]"} type="button" onClick={() => setMode("number")}>
                我有申请编号
              </button>
              <button className={mode === "forgot" ? "rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#7F1D1D] shadow-sm" : "rounded-xl px-4 py-2.5 text-sm font-medium text-[#66594d]"} type="button" onClick={() => setMode("forgot")}>
                我忘记申请编号
              </button>
            </div>

            <div className="mt-7 grid gap-5">
              {mode === "number" ? (
                <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                  <span className="text-sm font-medium text-porcelain">申请编号 <span className="text-[#7F1D1D]">*</span></span>
                  <input className="form-input" placeholder="例如 ITCA-M-2026-000001" required value={applicationNumber} onChange={(event) => setApplicationNumber(event.target.value)} />
                </label>
              ) : (
                <>
                  <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                    <span className="text-sm font-medium text-porcelain">申请类型 <span className="text-[#7F1D1D]">*</span></span>
                    <select className="form-input" value={applicationType} onChange={(event) => setApplicationType(event.target.value as QueryType)}>
                      <option value="personal_member">个人会员申请</option>
                      <option value="organization_member">机构会员申请</option>
                      <option value="taoist_certification">道士资格认证申请</option>
                    </select>
                  </label>
                  <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                    <span className="text-sm font-medium text-porcelain">{applicationType === "organization_member" ? "机构名称" : "中文姓名"} <span className="text-[#7F1D1D]">*</span></span>
                    <input className="form-input" required value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                  {applicationType === "organization_member" ? (
                    <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                      <span className="text-sm font-medium text-porcelain">联系人姓名 <span className="text-[#7F1D1D]">*</span></span>
                      <input className="form-input" required value={contactName} onChange={(event) => setContactName(event.target.value)} />
                    </label>
                  ) : null}
                  {applicationType === "taoist_certification" ? (
                    <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                      <span className="text-sm font-medium text-porcelain">道名 / 法名 <span className="text-[#7F1D1D]">*</span></span>
                      <input className="form-input" required value={taoistName} onChange={(event) => setTaoistName(event.target.value)} />
                    </label>
                  ) : null}
                </>
              )}
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">手机 / WhatsApp 或邮箱 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" placeholder="请输入提交申请时填写的联络方式" required value={contact} onChange={(event) => setContact(event.target.value)} />
              </label>
            </div>

            {errorMessage ? <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">{errorMessage}</div> : null}
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isQuerying} type="submit">
              {isQuerying ? "正在查询..." : "查询申请进度"}
            </button>
            <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#666666]">
              支持 ITCA-M、ITCA-O、ITCA-TAO 开头的申请编号。查询结果会脱敏显示，不展示完整个人资料、邮箱或手机号码。
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
                <StatusRow label="申请编号" value={maskApplicationNo(selectedApplication.applicationNo)} />
                <StatusRow label="申请类型" value={typeText[selectedApplication.applicationType]} />
                <StatusRow label="申请人 / 机构名称" value={maskName(selectedApplication.name)} />
                <StatusRow label="当前状态" value={currentStatusText(selectedApplication)} />
                <StatusRow label="提交时间" value={formatDateTime(selectedApplication.createdAt)} />
                <StatusRow label="审核说明" value={selectedApplication.adminNote || "暂无审核说明"} />
                <StatusRow label="下一步提示" value={nextStepText(selectedApplication.status)} />
                {selectedApplication.certificateNo ? (
                  <div className="border-b border-[#e4ded0] pb-4 last:border-b-0">
                    <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">证书编号</p>
                    <p className="mt-2 break-all text-sm leading-7 text-porcelain">{selectedApplication.certificateNo}</p>
                    <a className="mt-3 inline-flex rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink" href="/certificate-query">
                      前往证书查询
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-[#e4ded0] bg-white/74 p-5 text-sm leading-8 text-[#5f5b52]">
                <p className="font-medium text-porcelain">暂无查询结果</p>
                <p className="mt-2">请选择查询模式并填写资料。若查询不到结果，请确认填写信息是否与提交申请时一致，或联系协会秘书处协助核对。</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Status</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">状态说明</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {["已提交", "审核中", "需补充资料", "已通过", "已驳回", "已建档", "已发证", "已撤销"].map((item) => (
                <span className="rounded-full border border-[#e4ded0] bg-[#fbf8ef] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Boundary</p>
            <h2 className="mt-3 font-serif text-2xl text-porcelain">认证说明与适用范围</h2>
            <p className="mt-5">ITCA 道士资格认证属于协会认证与资料建档服务，不等同于政府许可、行政许可、法定职业资格、商业授权、宗教职务任命或任何法定执业许可。</p>
          </div>
        </section>
      </main>
    </>
  );
}

function nextStepText(status: string) {
  if (status === "need_more_info") return "请按审核说明补充资料，并等待协会秘书处进一步联系。";
  if (status === "approved") return "审核已通过，请等待证书记录生成或协会秘书处进一步通知。";
  if (status === "certificate_issued" || status === "cert_issued") return "证书已生成，可前往证书查询页面核验证书记录。";
  if (status === "delivered") return "证书已完成下发，可前往证书查询页面核验证书记录。";
  if (status === "rejected" || status === "revoked") return "如需复核，请联系协会秘书处协助核对。";
  return "请等待协会秘书处审核；如联系方式变更，请主动联系更新。";
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

function QueryPageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
      <section className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Query</p>
          <h1 className="mt-3 font-serif text-3xl text-porcelain">申请进度查询</h1>
          <p className="mt-4 text-sm leading-8 text-[#5f5b52]">用于查询个人会员申请进度、机构会员申请进度、道士资格认证申请进度及发证处理进度。</p>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-1.5">
            <span className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#7F1D1D] shadow-sm">我有申请编号</span>
            <span className="rounded-xl px-4 py-2.5 text-center text-sm font-medium text-[#66594d]">我忘记申请编号</span>
          </div>
          <div className="mt-7 grid gap-5">
            <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
              <span className="text-sm font-medium text-porcelain">申请编号</span>
              <input className="form-input" placeholder="例如 ITCA-M-2026-000001" readOnly />
            </label>
            <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
              <span className="text-sm font-medium text-porcelain">手机 / WhatsApp 或邮箱</span>
              <input className="form-input" placeholder="请输入提交申请时填写的联络方式" readOnly />
            </label>
          </div>
          <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white" type="button">
            查询申请进度
          </button>
        </div>
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Status</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询结果</h2>
          <div className="mt-7 rounded-2xl border border-[#e4ded0] bg-white/74 p-5 text-sm leading-8 text-[#5f5b52]">
            <p className="font-medium text-porcelain">暂无查询结果</p>
            <p className="mt-2">请选择查询模式并填写资料。若查询不到结果，请确认填写信息是否与提交申请时一致，或联系协会秘书处协助核对。</p>
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
