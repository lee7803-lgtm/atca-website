"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import type { CertificationStatus } from "@/types/certification";

const statusOptions: Array<{ value: CertificationStatus; label: string }> = [
  { value: "under_review", label: "设为审核中" },
  { value: "need_more_info", label: "要求补充材料" },
  { value: "approved", label: "审核通过" },
  { value: "rejected", label: "审核驳回" }
];

const statusText: Record<string, string> = {
  submitted: "已提交",
  under_review: "审核中",
  need_more_info: "需补充材料",
  approved: "审核通过",
  rejected: "审核未通过",
  certificate_issued: "已生成证书",
  cert_issued: "已生成证书",
  delivered: "已下发",
  archived: "已归档",
  revoked: "已撤销"
};

function buildReviewNote(reviewNote: string, taoistRank: string) {
  const cleaned = reviewNote.replace(/\n?证书等级 \/ 项目：.*$/m, "").trim();
  const rankLine = `证书等级 / 项目：${taoistRank || "道士资格认证"}`;
  return cleaned ? `${cleaned}\n${rankLine}` : rankLine;
}

function buildNotice(params: {
  type: "approved" | "need_more_info" | "rejected" | "certificate";
  applicantName: string;
  applicationNo: string;
  status: CertificationStatus;
  certificateNo?: string;
  applicantFeedback: string;
}) {
  const base = [`${params.applicantName} 您好：`, "", `您的 ITCA 道士资格认证申请（申请编号：${params.applicationNo}）当前状态为：${statusText[params.status] || params.status}。`];

  if (params.type === "approved") {
    base.push("", params.applicantFeedback || "您的申请已通过审核。后续如生成证书记录，可通过官网申请进度查询或证书核验入口查看。");
  }

  if (params.type === "need_more_info") {
    base.push("", params.applicantFeedback || "您的申请资料需要补充。请根据 ITCA 秘书处反馈补充相关材料后再继续审核。");
  }

  if (params.type === "rejected") {
    base.push("", params.applicantFeedback || "您的申请暂未通过审核。如需核对具体情况，请联系 ITCA 秘书处。");
  }

  if (params.type === "certificate") {
    base.push("", params.certificateNo ? `您的证书记录已生成，证书编号：${params.certificateNo}。` : "您的证书记录已生成或已完成下发。");
  }

  base.push("", "申请进度查询入口：https://www.itca.org/application/query");
  if (params.certificateNo) base.push(`证书核验入口：https://www.itca.org/certificate-query?certificateNo=${encodeURIComponent(params.certificateNo)}&holderName=${encodeURIComponent(params.applicantName)}`);
  base.push("", "如联系方式或资料需更新，请联系 ITCA 秘书处协助处理。");

  return base.join("\n");
}

type CertificationReviewFormProps = {
  applicationId: string;
  applicantName: string;
  applicationNo: string;
  certificateNo?: string;
  deliveryStatus: "not_delivered" | "delivered";
  deliveredAt: string | null;
  initialApplicantFeedback: string;
  initialInternalReviewNote: string;
  initialReviewNote: string;
  initialStatus: CertificationStatus;
};

export function CertificationReviewForm({
  applicationId,
  applicantName,
  applicationNo,
  certificateNo,
  deliveryStatus,
  deliveredAt,
  initialApplicantFeedback,
  initialInternalReviewNote,
  initialReviewNote,
  initialStatus
}: CertificationReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CertificationStatus>(initialStatus === "submitted" ? "under_review" : initialStatus);
  const [reviewNote, setReviewNote] = useState(initialReviewNote);
  const [internalReviewNote, setInternalReviewNote] = useState(initialInternalReviewNote);
  const [applicantFeedback, setApplicantFeedback] = useState(initialApplicantFeedback);
  const [taoistRank, setTaoistRank] = useState("道士资格认证");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const request = async (body: Record<string, unknown>, successMessage: string) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/certification-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewNote: buildReviewNote(reviewNote, taoistRank),
          internalReviewNote,
          applicantFeedback,
          taoistRank,
          ...body
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string; certificate?: { certificateNo?: string } };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "操作未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage(result.certificate?.certificateNo ? `${successMessage} 证书编号：${result.certificate.certificateNo}` : successMessage);
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("审核保存服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const saveStatus = () => request({ status }, "审核状态、内部备注和申请人反馈已保存。");
  const generateCertificate = () => request({ action: "generate_certificate", generateCertificate: true }, "证书记录已生成。");
  const markDelivered = () => request({ action: "mark_delivered" }, "证书已标记为已下发。");
  const archive = () => request({ action: "archive" }, "申请已归档。");

  const notices = useMemo(
    () => [
      { label: "复制审核通过通知", text: buildNotice({ type: "approved", applicantName, applicationNo, status: "approved", certificateNo, applicantFeedback }) },
      { label: "复制补充材料通知", text: buildNotice({ type: "need_more_info", applicantName, applicationNo, status: "need_more_info", certificateNo, applicantFeedback }) },
      { label: "复制审核未通过通知", text: buildNotice({ type: "rejected", applicantName, applicationNo, status: "rejected", certificateNo, applicantFeedback }) },
      { label: "复制证书通知", text: buildNotice({ type: "certificate", applicantName, applicationNo, status: deliveryStatus === "delivered" ? "delivered" : "certificate_issued", certificateNo, applicantFeedback }) }
    ],
    [applicantFeedback, applicantName, applicationNo, certificateNo, deliveryStatus]
  );

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Review</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">审核处理</h2>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">状态操作</span>
          <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as CertificationStatus)}>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">内部审核备注</span>
          <textarea className="form-input min-h-32 resize-y" value={internalReviewNote} onChange={(event) => setInternalReviewNote(event.target.value)} />
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">对申请人反馈</span>
          <textarea className="form-input min-h-32 resize-y" value={applicantFeedback} onChange={(event) => setApplicantFeedback(event.target.value)} />
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">证书等级 / 项目</span>
          <input className="form-input" value={taoistRank} onChange={(event) => setTaoistRank(event.target.value)} />
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">证书项目备注</span>
          <textarea className="form-input min-h-24 resize-y" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
        </label>
      </div>
      <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
        <p>下发状态：{deliveryStatus === "delivered" ? "已下发" : "未下发"}</p>
        <p>下发时间：{deliveredAt ? new Date(deliveredAt).toLocaleString("zh-HK") : "未记录"}</p>
      </div>
      {message ? <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>{message}</div> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={saveStatus} type="button">
          {isSaving ? "正在保存..." : "保存状态与反馈"}
        </button>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={generateCertificate} type="button">
          生成证书
        </button>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={markDelivered} type="button">
          标记已下发
        </button>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={archive} type="button">
          归档
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
        <h3 className="font-serif text-2xl text-porcelain">通知文案复制</h3>
        <div className="mt-5 grid gap-4">
          {notices.map((notice) => (
            <div className="rounded-xl border border-[#e4ded0] bg-white p-4" key={notice.label}>
              <textarea className="form-input min-h-32 resize-y text-xs leading-6" readOnly value={notice.text} />
              <div className="mt-3">
                <CopyButton label={notice.label} text={notice.text} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
