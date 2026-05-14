"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CertificationStatus } from "@/types/certification";

const statusOptions: Array<{ value: CertificationStatus; label: string }> = [
  { value: "submitted", label: "已提交" },
  { value: "under_review", label: "审核中" },
  { value: "need_more_info", label: "需补充资料" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "cert_issued", label: "已发证" },
  { value: "revoked", label: "已撤销" }
];

export function CertificationReviewForm({ applicationId, initialReviewNote, initialStatus }: { applicationId: string; initialReviewNote: string; initialStatus: CertificationStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<CertificationStatus>(initialStatus);
  const [reviewNote, setReviewNote] = useState(initialReviewNote);
  const [taoistRank, setTaoistRank] = useState("道士资格认证");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (generateCertificate = false) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/certification-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generateCertificate ? { generateCertificate, reviewNote, taoistRank } : { status, reviewNote })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessage(result.message || "审核结果未能保存。");
        return;
      }

      setMessage(generateCertificate ? "证书记录已生成。" : "审核状态和备注已保存。");
      router.refresh();
    } catch {
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
          <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as CertificationStatus)}>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">审核备注</span>
          <textarea className="form-input min-h-36 resize-y" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">证书等级 / 项目</span>
          <input className="form-input" value={taoistRank} onChange={(event) => setTaoistRank(event.target.value)} />
        </label>
      </div>
      {message ? <div className="mt-5 border-l-4 border-[#8a6b3e] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">{message}</div> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={() => save(false)} type="button">
          {isSaving ? "正在保存..." : "保存审核结果"}
        </button>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={() => save(true)} type="button">
          审核通过后生成证书记录
        </button>
      </div>
    </section>
  );
}
