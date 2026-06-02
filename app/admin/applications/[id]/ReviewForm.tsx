"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTemplateButtons } from "@/components/admin/AdminTemplateButtons";
import {
  mergeMemberMaterialReview,
  memberMaterialReviewLabels,
  memberMaterialReviewStatusLabels,
  parseMemberMaterialReview,
  stripMemberMaterialReview,
  type MemberMaterialReviewKey,
  type MemberMaterialReviewState,
  type MemberMaterialReviewStatus
} from "@/lib/member-material-review";
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

const materialReviewNoteTemplates = [
  { label: "资料完整", text: "资料完整，内容清晰，符合当前审核要求。" },
  { label: "需补充说明", text: "资料基本完整，但仍需申请人补充说明。" },
  { label: "信息不一致", text: "资料信息不一致，需申请人重新提交或补充证明。" },
  { label: "建议不通过", text: "资料暂不符合审核要求，建议不通过。" }
];

const initialReviewNoteTemplates = [
  { label: "进入付款", text: "资料组审核均已通过，建议进入付款通知流程。" },
  { label: "待补充", text: "资料仍有缺失，需申请人补充后再进入下一阶段。" },
  { label: "建议驳回", text: "资料存在不一致或不符合要求，建议驳回。" }
];

const memberFinalReviewTemplates = [
  { label: "建议通过", text: "初审、付款及资料复核均已完成，建议通过。" },
  { label: "暂缓通过", text: "仍需进一步核对资料或付款信息，暂缓通过。" },
  { label: "建议不通过", text: "复审发现资料或流程存在问题，建议不通过。" },
  { label: "要求补充", text: "需申请人补充资料或说明后再继续审核。" }
];

const memberStatusNoteTemplates = [
  { label: "状态有效", text: "会员资料与有效期已核对，会员状态维持有效。" },
  { label: "续期中", text: "会员续期处理中，待进一步核对资料与有效期信息。" },
  { label: "暂停", text: "会员状态暂时暂停，待相关情况核实后再恢复或进一步处理。" },
  { label: "撤销", text: "会员状态变更已记录，原因见后台备注。" }
];

export function ReviewForm({
  applicationId,
  approveBlockers = [],
  hiddenAdminNoteSuffix = "",
  initialAdminNote,
  initialStatus
}: {
  applicationId: string;
  approveBlockers?: string[];
  hiddenAdminNoteSuffix?: string;
  initialAdminNote: string;
  initialStatus: ApplicationStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [adminNote, setAdminNote] = useState(stripMemberMaterialReview(initialAdminNote));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const save = async () => {
    if (status === "approved" && approveBlockers.length > 0) {
      setMessageTone("error");
      setMessage(`暂不能复审通过：${approveBlockers.join("；")}。`);
      return;
    }
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
        body: JSON.stringify({ status, adminNote: [adminNote.trim(), hiddenAdminNoteSuffix.trim()].filter(Boolean).join("\n\n") })
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
            {statusOptions.map((item) => <option disabled={item.value === "approved" && approveBlockers.length > 0} key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">审核备注</span>
          <textarea className="form-input min-h-36 resize-y" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
        </label>
        <AdminTemplateButtons onSelect={setAdminNote} templates={memberFinalReviewTemplates} />
      </div>
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      {approveBlockers.length > 0 ? (
        <div className="mt-5 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#7F1D1D]">
          复审通过暂不可用：{approveBlockers.join("；")}。
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存审核结果"}
      </button>
    </section>
  );
}

export function MemberMaterialReviewField({
  adminNote,
  applicationId,
  currentStatus,
  disabled,
  disabledReason,
  itemKey,
  review
}: {
  adminNote: string;
  applicationId: string;
  currentStatus: ApplicationStatus;
  disabled: boolean;
  disabledReason?: string;
  itemKey: MemberMaterialReviewKey;
  review: MemberMaterialReviewState;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MemberMaterialReviewStatus>(review[itemKey].status);
  const [note, setNote] = useState(review[itemKey].note);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    const currentReview = parseMemberMaterialReview(adminNote);
    const nextReview: MemberMaterialReviewState = {
      ...currentReview,
      [itemKey]: { status, note: note.trim() }
    };
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_member_material_review",
          status: currentStatus,
          adminNote: mergeMemberMaterialReview(adminNote, nextReview)
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        setMessage(result.message || "资料审核状态未能保存。");
        return;
      }
      setMessage("已保存");
      router.refresh();
    } catch {
      setMessage("资料审核状态暂时无法保存。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-porcelain">{memberMaterialReviewLabels[itemKey]}审核状态</span>
        <select className="form-input" disabled={disabled || isSaving} value={status} onChange={(event) => setStatus(event.target.value as MemberMaterialReviewStatus)}>
          {Object.entries(memberMaterialReviewStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-porcelain">审核说明</span>
        <textarea className="form-input min-h-24 resize-y" disabled={disabled || isSaving} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <AdminTemplateButtons disabled={disabled || isSaving} onSelect={setNote} templates={materialReviewNoteTemplates} />
      {disabled && disabledReason ? <p className="text-sm leading-6 text-[#7F1D1D]">{disabledReason}</p> : null}
      {message ? <p className={`text-sm ${message === "已保存" ? "text-[#8a6b3e]" : "text-[#7F1D1D]"}`}>{message}</p> : null}
      <button className="w-full rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={disabled || isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存本组审核"}
      </button>
    </div>
  );
}

export function MemberInitialReviewForm({
  adminNote,
  applicationId,
  blockers,
  currentStatus,
  review
}: {
  adminNote: string;
  applicationId: string;
  blockers: string[];
  currentStatus: ApplicationStatus;
  review: MemberMaterialReviewState;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MemberMaterialReviewStatus>(review.initialReview.status);
  const [note, setNote] = useState(review.initialReview.note);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    if (status === "approved" && blockers.length > 0) {
      setMessage(`暂不能初审通过：${blockers.join("；")}。`);
      return;
    }

    const currentReview = parseMemberMaterialReview(adminNote);
    const nextReview: MemberMaterialReviewState = {
      ...currentReview,
      initialReview: { status, note: note.trim() }
    };
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_member_material_review",
          status: currentStatus,
          adminNote: mergeMemberMaterialReview(adminNote, nextReview)
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        setMessage(result.message || "初审记录未能保存。");
        return;
      }
      setMessage("已保存");
      router.refresh();
    } catch {
      setMessage("初审记录暂时无法保存。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Initial Review</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">初审处理</h2>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">初审结论</span>
          <select className="form-input" disabled={isSaving} value={status} onChange={(event) => setStatus(event.target.value as MemberMaterialReviewStatus)}>
            {Object.entries(memberMaterialReviewStatusLabels).map(([value, label]) => (
              <option disabled={value === "approved" && blockers.length > 0} key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">初审说明</span>
          <textarea className="form-input min-h-28 resize-y" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <AdminTemplateButtons disabled={isSaving} onSelect={setNote} templates={initialReviewNoteTemplates} />
      </div>
      {blockers.length > 0 ? (
        <div className="mt-5 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#7F1D1D]">
          初审通过暂不可用：{blockers.join("；")}。
        </div>
      ) : null}
      {message ? <p className={`mt-5 text-sm ${message === "已保存" ? "text-[#8a6b3e]" : "text-[#7F1D1D]"}`}>{message}</p> : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存初审记录"}
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

export function MemberStatusForm({ application, disabled = false, disabledReason = "" }: { application: ApplicationAdminRecord; disabled?: boolean; disabledReason?: string }) {
  const router = useRouter();
  const [memberValidFrom, setMemberValidFrom] = useState(application.memberValidFrom || "");
  const [memberValidUntil, setMemberValidUntil] = useState(application.memberValidUntil || "");
  const [businessStatus, setBusinessStatus] = useState<MemberBusinessStatus>(getInitialBusinessStatus(application));
  const [memberStatusNote, setMemberStatusNote] = useState(application.memberStatusNote || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const save = async () => {
    if (disabled) {
      setMessageTone("error");
      setMessage(disabledReason || "复审通过后才能维护会员编号、有效期和会员业务状态。");
      return;
    }
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
          <select className="form-input" disabled={disabled} value={businessStatus} onChange={(event) => setBusinessStatus(event.target.value as MemberBusinessStatus)}>
            {memberBusinessStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-3">
            <span className="text-sm font-medium text-porcelain">有效期开始</span>
            <input className="form-input" disabled={disabled} type="date" value={memberValidFrom} onChange={(event) => setMemberValidFrom(event.target.value)} />
          </label>
          <label className="grid gap-3">
            <span className="text-sm font-medium text-porcelain">有效期截止</span>
            <input className="form-input" disabled={disabled} type="date" value={memberValidUntil} onChange={(event) => setMemberValidUntil(event.target.value)} />
          </label>
        </div>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">状态备注</span>
          <textarea className="form-input min-h-24 resize-y" disabled={disabled} value={memberStatusNote} onChange={(event) => setMemberStatusNote(event.target.value)} />
        </label>
        <AdminTemplateButtons disabled={disabled} onSelect={setMemberStatusNote} templates={memberStatusNoteTemplates} />
      </div>
      {disabled && disabledReason ? (
        <div className="mt-5 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#7F1D1D]">{disabledReason}</div>
      ) : null}
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={disabled || isSaving} onClick={save} type="button">
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
