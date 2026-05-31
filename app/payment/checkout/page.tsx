import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { findPublicPaymentOrderByOrderNo } from "@/lib/supabase/server";
import { formatPaymentAmount, formatPaymentDateTime, formatPaymentProvider, paymentBusinessTypeText, paymentStatusText } from "@/lib/payment-display";
import type { PublicPaymentOrder } from "@/types/payment";

export const dynamic = "force-dynamic";

export default async function PaymentCheckoutPage({ searchParams }: { searchParams: { orderNo?: string } }) {
  const orderNo = searchParams.orderNo?.trim() || "";
  const order = orderNo ? await findPublicPaymentOrderByOrderNo(orderNo) : null;
  if (!order) notFound();

  const needsManualConfirmation = order.status === "pending_payment" || order.status === "manual_review";

  return (
    <>
      <PageHero
        actions={[
          { label: "申请查询", href: "/application/query" },
          { label: "付款结果", href: `/payment/result?orderNo=${encodeURIComponent(order.orderNo)}` }
        ]}
        eyebrow="Payment"
        title="付款说明"
        subtitle="Manual Payment Instruction"
        intro="本页面仅展示申请相关的付款订单状态与线下付款说明。付款确认由协会秘书处后台人工处理。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="当前阶段不接入真实支付网关，不在前台变更付款状态。"
        visualEyebrow="Order"
        visualMark="PAY"
        visualSeal="付款"
        visualTitle={order.orderNo}
      />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Payment Order</p>
          <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{order.orderNo}</h1>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <PaymentInfoItem label="支付订单编号" value={order.orderNo} />
            <PaymentInfoItem label="业务类型" value={paymentBusinessTypeText[order.businessType] || order.businessType} />
            <PaymentInfoItem label="关联申请编号" value={order.applicationNo || "未记录"} />
            <PaymentInfoItem label="付款人姓名" value={order.payerName || "未记录"} />
            <PaymentInfoItem label="金额" value={formatPaymentAmount(order.amount, order.currency)} />
            <PaymentInfoItem label="支付渠道" value={order.paymentChannel || "manual"} />
            <PaymentInfoItem label="Provider" value={formatPaymentProvider(order.provider, order.paymentChannel)} />
            <PaymentInfoItem label="支付状态" value={paymentStatusText[order.status]} />
            <PaymentInfoItem label="创建时间" value={formatPaymentDateTime(order.createdAt)} />
            <PaymentInfoItem label="支付确认时间" value={formatPaymentDateTime(order.paidAt)} />
            <PaymentInfoItem label="取消时间" value={formatPaymentDateTime(order.cancelledAt)} />
          </div>
        </section>

        {needsManualConfirmation ? <ManualInstruction order={order} /> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href={`/payment/result?orderNo=${encodeURIComponent(order.orderNo)}`}>
            查看付款结果
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href={`/application/query?number=${encodeURIComponent(order.applicationNo)}`}>
            返回申请进度查询
          </Link>
        </div>
      </main>
    </>
  );
}

function ManualInstruction({ order }: { order: PublicPaymentOrder }) {
  return (
    <section className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Instruction</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">线下付款说明</h2>
      <div className="mt-5 grid gap-4 text-sm leading-8 text-[#5f5b52]">
        <p>当前订单采用人工确认 / 线下付款流程。请按协会秘书处通知的方式完成付款，并保留付款凭证。</p>
        <p>付款后请等待秘书处在后台确认。前台页面不会修改订单状态，也不会把订单标记为已付款。</p>
        <p className="rounded-2xl border border-[#e4ded0] bg-white p-4 font-medium text-porcelain">付款备注建议填写：{order.orderNo} / {order.applicationNo}</p>
      </div>
    </section>
  );
}

function PaymentInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#eee7da] pb-4">
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-all text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}
