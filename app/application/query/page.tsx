"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { PageHero } from "@/components/PageHero";
import type { ApplicationQueryResponse, ApplicationQueryResult, ApplicationStatus } from "@/types/application";

const statusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "未通过"
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
  const [email, setEmail] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [application, setApplication] = useState<ApplicationQueryResult | null>(null);

  const submitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isQuerying) return;

    setIsQuerying(true);
    setErrorMessage("");
    setApplication(null);

    try {
      const params = new URLSearchParams({
        applicationNo: applicationNumber.trim(),
        email: email.trim()
      });
      const response = await fetch(`/api/applications/query?${params.toString()}`);
      const result = (await response.json()) as ApplicationQueryResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.success === false ? result.message : "申请查询未成功，请检查资料后重新查询。");
        return;
      }

      setApplication(result.application);
    } catch {
      setErrorMessage("申请查询服务暂时不可用，请稍后重试或联系协会秘书处。");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Application Query"
        title="申请进度查询"
        subtitle="Application Status Query"
        intro="用于申请人通过申请编号与邮箱查询审核进度。本阶段暂不接数据库，提交后展示静态示例结果区域，便于后续接入真实记录。"
        imageSrc="/images/atca/certificate-verification.jpg"
        imagePosition="center 58%"
        visualDescription="请输入申请编号与邮箱，后续将用于匹配申请记录和审核状态。"
        visualEyebrow="Query"
        visualMark="Status"
        visualSeal="查询"
        visualTitle="申请进度查询"
      />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitQuery}>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Query Form</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询申请记录</h2>
            <div className="mt-7 grid gap-5">
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">申请编号 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" required value={applicationNumber} onChange={(event) => setApplicationNumber(event.target.value)} />
              </label>
              <label className="grid gap-3 rounded-2xl bg-white/45 p-3">
                <span className="text-sm font-medium text-porcelain">邮箱 <span className="text-[#7F1D1D]">*</span></span>
                <input className="form-input" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
            </div>
            {errorMessage ? (
              <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">
                {errorMessage}
              </div>
            ) : null}
            <button className="mt-7 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isQuerying} type="submit">
              {isQuerying ? "正在查询..." : "查询申请进度"}
            </button>
          </form>

          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Status</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">查询结果</h2>
            {application ? (
              <div className="mt-7 grid gap-4">
                <StatusRow label="申请编号" value={application.applicationNo} />
                <StatusRow label="申请类型" value={application.applicationType === "organization_member" ? "机构会员申请" : "个人会员申请"} />
                <StatusRow label="申请名称" value={application.name} />
                <StatusRow label="当前状态" value={statusText[application.status]} />
                <StatusRow label="审核备注" value={application.adminNote || "暂无备注"} />
                <StatusRow label="提交时间" value={formatDateTime(application.createdAt)} />
                <StatusRow label="更新时间" value={formatDateTime(application.updatedAt)} />
              </div>
            ) : (
              <p className="mt-7 text-sm leading-8 text-[#5f5b52]">
                填写申请编号与邮箱后，此区域将显示数据库中的申请状态。页面仅展示查询所需的基础结果，不展示完整申请资料。
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function QueryPageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-8 text-sm text-[#5f5b52] shadow-aureate">
        正在载入申请进度查询...
      </div>
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
