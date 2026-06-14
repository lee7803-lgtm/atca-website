"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTemplateButtons } from "@/components/admin/AdminTemplateButtons";
import type { PaymentOrderDetail } from "@/lib/api/payments";

type CreatePaymentOrderFormProps = {
  sourceType: "application" | "certification_application";
  sourceId: string;
  title?: string;
};

type CreatePaymentOrderResponse =
  | {
      success: true;
      order: PaymentOrderDetail;
      created: boolean;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

const paymentOrderNoteTemplates = [
  { label: "银行电汇", text: "已按当前申请流程生成银行电汇支付订单，待申请人上传银行回执。" },
  { label: "人工复核", text: "付款金额或付款信息需人工复核，请财务确认后再进入后续流程。" },
  { label: "后续复审", text: "支付订单用于当前申请审核流程，确认收款后仍需按流程完成复审。" }
];

export function CreatePaymentOrderForm({ sourceId, sourceType, title = "生成支付订单" }: CreatePaymentOrderFormProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const provider: "manual" = "manual";
  const paymentChannel = "bank_transfer";
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<boolean | null>(null);
  const [order, setOrder] = useState<PaymentOrderDetail | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setCreated(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("请输入大于 0 的金额。");
      setIsSaving(false);
      return;
    }
    if (!window.confirm("确认生成银行电汇支付订单？该操作会写入支付订单并影响申请流转。")) {
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceType,
          sourceId,
          amount: numericAmount,
          currency,
          provider,
          paymentChannel,
          adminNote
        })
      });
      const result = (await response.json().catch(() => null)) as CreatePaymentOrderResponse | null;

      if (!response.ok || !result || !result.success) {
        setMessage(result && !result.success ? result.message : "支付订单未能生成。");
        return;
      }

      setOrder(result.order);
      setCreated(result.created);
      setMessage(result.message);
    } catch {
      setMessage("支付订单创建服务暂时不可用。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Payment Order</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">当前仅生成银行电汇 / 线下转账支付订单。申请人通过申请查询页查看付款说明并上传银行回执 / 付款凭证。</p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          金额
          <input className="rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm text-ink outline-none focus:border-[#7F1D1D]" min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          币种
          <input className="rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm uppercase text-ink outline-none focus:border-[#7F1D1D]" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
        </label>
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          <p className="font-medium text-porcelain">付款方式：银行电汇 / Bank Transfer</p>
          <p className="mt-1">本阶段仅开放银行电汇。银行账户信息请以秘书处通知或后台配置文案为准。</p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          后台备注
          <textarea className="min-h-28 rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm leading-7 text-ink outline-none focus:border-[#7F1D1D]" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
        </label>
        <AdminTemplateButtons disabled={isSaving} onSelect={setAdminNote} templates={paymentOrderNoteTemplates} />
        <button className="w-full rounded-full bg-[#7F1D1D] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:bg-[#a89b89] sm:w-auto" disabled={isSaving} type="submit">
          {isSaving ? "生成中..." : "生成支付订单"}
        </button>
      </form>
      {message ? (
        <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          <p>{message}</p>
          {order ? (
            <div className="mt-3 grid gap-2">
              <p className="break-all font-semibold text-porcelain">{created === false ? "已有订单" : "支付订单"}：{order.orderNo}</p>
              <Link className="font-semibold text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/payments/${order.id}`}>
                查看支付订单详情
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
