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
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
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
        <div className="flex flex-wrap gap-2">
          {reviewTemplates.map((template) => (
            <button
              className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-[#8a6b3e] hover:text-[#7F1D1D]"
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
      <button className="mt-6 rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存审核结果"}
      </button>
    </section>
  );
}

const memberStatusOptions = [
  { value: "active", label: "有效" },
  { value: "suspended", label: "已暂停" },
  { value: "revoked", label: "已撤销" },
  { value: "terminated", label: "已终止" }
];

const renewalStatusOptions = [
  { value: "none", label: "无" },
  { value: "pending_renewal", label: "待续期" },
  { value: "renewed", label: "已续期" },
  { value: "pending_review", label: "待复审" }
];

export function MemberValidityForm({ application }: { application: ApplicationAdminRecord }) {
  const router = useRouter();
  const [memberValidFrom, setMemberValidFrom] = useState(application.memberValidFrom || "");
  const [memberValidUntil, setMemberValidUntil] = useState(application.memberValidUntil || "");
  const [memberStatus, setMemberStatus] = useState(application.memberStatus || "active");
  const [memberRenewalStatus, setMemberRenewalStatus] = useState(application.memberRenewalStatus || "none");
  const [lastRenewedAt, setLastRenewedAt] = useState(application.lastRenewedAt ? application.lastRenewedAt.slice(0, 10) : "");
  const [memberStatusNote, setMemberStatusNote] = useState(application.memberStatusNote || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const renewalMessage = buildRenewalMessage(memberValidUntil, application.daysUntilExpiry);

  const save = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/applications/${application.id}/member-validity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberValidFrom: memberValidFrom || null,
          memberValidUntil: memberValidUntil || null,
          memberStatus,
          memberRenewalStatus,
          lastRenewedAt: lastRenewedAt ? new Date(`${lastRenewedAt}T00:00:00.000Z`).toISOString() : null,
          memberStatusNote
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "会员有效期资料未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage("会员有效期资料已保存。");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("会员有效期保存服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const copyRenewalMessage = async () => {
    await navigator.clipboard.writeText(renewalMessage);
    setMessageTone("success");
    setMessage("续期提醒文案已复制。");
  };

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Validity</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">会员有效期</h2>
      <div className="mt-6 grid gap-5">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-3">
            <span className="text-sm font-medium text-porcelain">会员状态</span>
            <select className="form-input" value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}>
              {memberStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="grid gap-3">
            <span className="text-sm font-medium text-porcelain">续期状态</span>
            <select className="form-input" value={memberRenewalStatus} onChange={(event) => setMemberRenewalStatus(event.target.value)}>
              {renewalStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">最近续期时间</span>
          <input className="form-input" type="date" value={lastRenewedAt} onChange={(event) => setLastRenewedAt(event.target.value)} />
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">后台会员状态备注</span>
          <textarea className="form-input min-h-24 resize-y" value={memberStatusNote} onChange={(event) => setMemberStatusNote(event.target.value)} />
        </label>
        <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          {renewalMessage}
        </div>
      </div>
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={save} type="button">
          {isSaving ? "正在保存..." : "保存会员有效期"}
        </button>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" onClick={copyRenewalMessage} type="button">
          复制续期提醒文案
        </button>
      </div>
    </section>
  );
}

function buildRenewalMessage(validUntil: string, daysUntilExpiry: number | null) {
  const date = validUntil || "有效期截止日期";
  if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
    return `您好，您的 ITCA 会员资格已于 ${date} 到期。当前公开核验状态可能显示为已过期。如需恢复有效状态，请联系协会办理续期。`;
  }

  return `您好，您的 ITCA 会员资格将于 ${date} 到期。为避免影响会员核验状态，请及时联系协会办理续期手续。`;
}
