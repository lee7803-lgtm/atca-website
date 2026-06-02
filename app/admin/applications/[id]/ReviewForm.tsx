"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationAdminRecord, ApplicationStatus } from "@/types/application";

const statusOptions: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "submitted", label: "已提交" },
  { value: "pending_review", label: "待审核" },
  { value: "under_review", label: "审核中" },
  { value: "need_more_info", label: "需补充资料" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "archived", label: "已建档" }
];

const reviewTemplates = [
  { label: "资料完整", text: "资料完整，建议审核通过。" },
  { label: "需补充资料", text: "资料基本完整，但仍需申请人补充联系方式、身份证明或相关说明后再复核。" },
  { label: "暂不完整", text: "申请资料暂不完整，请申请人补充必要资料后再继续审核。" },
  { label: "建议不通过", text: "当前资料暂不符合会员申请要求，建议暂不通过。" }
];

export function ReviewForm({ applicationId, initialAdminNote, initialStatus }: { applicationId: string; initialAdminNote: string; initialStatus: ApplicationStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [adminNote, setAdminNote] = useState(initialAdminNote);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const save = async () => {
    if (status === "need_more_info" && !adminNote.trim()) {
      setMessageTone("error");
      setMessage("请填写需要申请人补充或修正的资料说明。");
      return;
    }
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "审核结果未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage("审核状态和备注已保存。");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("审核保存服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Review</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">审核处理</h2>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">当前状态</span>
          <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">审核备注</span>
          <textarea className="form-input min-h-36 resize-y" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {reviewTemplates.map((template) => (
            <button
              className="w-full rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-center text-xs font-semibold text-ink transition hover:border-[#8a6b3e] hover:text-[#7F1D1D] sm:w-auto"
              key={template.label}
              onClick={() => setAdminNote(template.text)}
              type="button"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存审核结果"}
      </button>
    </section>
  );
}

type MemberBusinessStatus = "active" | "pending_renewal" | "renewal_in_progress" | "renewed" | "suspended" | "terminated" | "revoked";

const memberBusinessStatusOptions: Array<{ value: MemberBusinessStatus; label: string }> = [
  { value: "active", label: "有效" },
  { value: "pending_renewal", label: "待续期" },
  { value: "renewal_in_progress", label: "续期中" },
  { value: "renewed", label: "已续期" },
  { value: "suspended", label: "已暂停" },
  { value: "terminated", label: "已终止" },
  { value: "revoked", label: "已撤销" }
];

export function MemberStatusForm({ application }: { application: ApplicationAdminRecord }) {
  const router = useRouter();
  const [memberValidFrom, setMemberValidFrom] = useState(application.memberValidFrom || "");
  const [memberValidUntil, setMemberValidUntil] = useState(application.memberValidUntil || "");
  const [businessStatus, setBusinessStatus] = useState<MemberBusinessStatus>(getInitialBusinessStatus(application));
  const [memberStatusNote, setMemberStatusNote] = useState(application.memberStatusNote || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const save = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const mapped = mapBusinessStatusForSave(businessStatus);
      const response = await fetch(`/api/admin/applications/${application.id}/member-validity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberValidFrom: memberValidFrom || null,
          memberValidUntil: memberValidUntil || null,
          memberStatus: mapped.memberStatus,
          memberRenewalStatus: mapped.memberRenewalStatus,
          lastRenewedAt: businessStatus === "renewed" ? new Date().toISOString() : application.lastRenewedAt,
          memberStatusNote
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "会员状态未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage("会员状态已保存。");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("会员状态保存服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Membership Status</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">会员状态维护</h2>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">会员业务状态</span>
          <select className="form-input" value={businessStatus} onChange={(event) => setBusinessStatus(event.target.value as MemberBusinessStatus)}>
            {memberBusinessStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-3">
            <span className="text-sm font-medium text-porcelain">有效期开始</span>
            <input className="form-input" type="date" value={memberValidFrom} onChange={(event) => setMemberValidFrom(event.target.value)} />
          </label>
          <label className="grid gap-3">
            <span className="text-sm font-medium text-porcelain">有效期截止</span>
            <input className="form-input" type="date" value={memberValidUntil} onChange={(event) => setMemberValidUntil(event.target.value)} />
          </label>
        </div>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">状态备注</span>
          <textarea className="form-input min-h-24 resize-y" value={memberStatusNote} onChange={(event) => setMemberStatusNote(event.target.value)} />
        </label>
      </div>
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存会员状态"}
      </button>
    </section>
  );
}

function getInitialBusinessStatus(application: ApplicationAdminRecord): MemberBusinessStatus {
  if (application.memberStatus === "revoked") return "revoked";
  if (application.memberStatus === "terminated") return "terminated";
  if (application.memberStatus === "suspended") return "suspended";
  if (application.memberRenewalStatus === "pending_renewal") return "pending_renewal";
  if (application.memberRenewalStatus === "renewal_in_progress" || application.memberRenewalStatus === "pending_review") return "renewal_in_progress";
  if (application.memberRenewalStatus === "renewed") return "renewed";
  return "active";
}

function mapBusinessStatusForSave(status: MemberBusinessStatus) {
  if (status === "suspended" || status === "terminated" || status === "revoked") {
    return { memberStatus: status, memberRenewalStatus: "none" };
  }

  if (status === "pending_renewal" || status === "renewal_in_progress" || status === "renewed") {
    return { memberStatus: "active", memberRenewalStatus: status };
  }

  return { memberStatus: "active", memberRenewalStatus: "none" };
}
