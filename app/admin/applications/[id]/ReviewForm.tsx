"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@/types/application";

const statusOptions: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "submitted", label: "已提交" },
  { value: "pending_review", label: "审核中" },
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
