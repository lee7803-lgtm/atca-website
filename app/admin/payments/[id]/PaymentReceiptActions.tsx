"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminTemplateButtons } from "@/components/admin/AdminTemplateButtons";

const receiptReviewTemplates = [
  { label: "确认收款", text: "已收到银行电汇付款凭证，金额与订单基本匹配，建议确认收款。" },
  { label: "凭证不清晰", text: "付款凭证信息不清晰，需申请人重新上传银行回执。" },
  { label: "信息不一致", text: "付款金额或付款信息与订单不一致，需人工复核。" },
  { label: "进入复审", text: "已完成财务确认，可进入后续复审流程。" }
];

export function PaymentReceiptActions({ orderId, hasReceipt, reviewStatus }: { orderId: string; hasReceipt: boolean; reviewStatus: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  async function openReceipt() {
    if (!hasReceipt || isOpening) return;
    setIsOpening(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/payments/${orderId}/receipt`);
      const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string; url?: string } | null;
      if (!response.ok || !result?.success || !result.url) {
        setMessage(result?.message || "付款凭证查看链接暂时无法生成。");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("付款凭证查看服务暂时不可用。");
    } finally {
      setIsOpening(false);
    }
  }

  async function submit(action: "approve" | "reject") {
    if (!hasReceipt || isSaving) return;
    setIsSaving(action);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/payments/${orderId}/receipt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note })
      });
      const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (!response.ok || !result?.success) {
        setMessage(result?.message || "付款凭证审核未能保存。");
        return;
      }
      setMessage(result.message || "付款凭证审核已保存。");
      setNote("");
      router.refresh();
    } catch {
      setMessage("付款凭证审核服务暂时不可用。");
    } finally {
      setIsSaving("");
    }
  }

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Finance Review</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">付款凭证财务审核</h2>
      <p className="mt-4 text-sm leading-7 text-[#5f5b52]">付款凭证存放于私有备案位置。后台只通过管理员接口生成短时查看链接，不展示底层文件路径。</p>
      <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
        当前凭证状态：{formatReviewStatus(reviewStatus)}
      </div>
      <button className="mt-5 w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={!hasReceipt || isOpening} onClick={openReceipt} type="button">
        {isOpening ? "正在生成链接..." : "查看 / 下载付款凭证"}
      </button>
      <label className="mt-5 grid gap-3">
        <span className="text-sm font-medium text-porcelain">财务审核备注</span>
        <textarea className="form-input min-h-24 resize-y" value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="mt-3">
        <AdminTemplateButtons disabled={!hasReceipt || Boolean(isSaving)} onSelect={setNote} templates={receiptReviewTemplates} />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button className="rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={!hasReceipt || Boolean(isSaving)} onClick={() => submit("approve")} type="button">
          {isSaving === "approve" ? "正在确认..." : "确认已收款"}
        </button>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={!hasReceipt || Boolean(isSaving)} onClick={() => submit("reject")} type="button">
          {isSaving === "reject" ? "正在保存..." : "凭证不通过 / 要求重新上传"}
        </button>
      </div>
      {!hasReceipt ? <p className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">申请人尚未上传付款凭证。</p> : null}
      {message ? <p className="mt-5 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]">{message}</p> : null}
    </section>
  );
}

function formatReviewStatus(value: string) {
  if (value === "approved") return "已通过";
  if (value === "rejected") return "不通过，需重新上传";
  if (value === "pending_review") return "待财务审核";
  return "未上传";
}
