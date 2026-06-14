import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { findPublicPaymentOrderByOrderNo } from "@/lib/supabase/server";
import { formatPaymentAmount, formatPaymentDateTime, formatPaymentProvider, paymentBusinessTypeText, paymentStatusText } from "@/lib/payment-display";
import type { PublicPaymentOrder } from "@/types/payment";

export const dynamic = "force-dynamic";

export default async function PaymentCheckoutPage({ searchParams }: { searchParams: { orderNo?: string } }) {
  const orderNo = searchParams.orderNo?.trim() || "";
  const order = orderNo ? await findPublicPaymentOrderByOrderNo(orderNo) : null;
  if (!order) return <PaymentEntryNotice />;

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
        intro="本页面仅展示申请相关的付款订单状态与银行电汇说明。付款确认由财务后台审核银行回执后处理。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="当前阶段仅开放银行电汇，不在前台变更付款状态。"
        visualEyebrow="Order"
        visualMark="PAY"
        visualSeal="付款"
        visualTitle={order.orderNo}
      />
      <main className="mx-auto w-full max-w-5xl min-w-0 overflow-x-hidden px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Payment Order</p>
          <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{order.orderNo}</h1>
          <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-2">
            <PaymentInfoItem label="支付订单编号" value={order.orderNo} />
            <PaymentInfoItem label="业务类型" value={paymentBusinessTypeText[order.businessType] || order.businessType} />
            <PaymentInfoItem label="关联申请编号" value={order.applicationNo || "未记录"} />
            <PaymentInfoItem label="付款人姓名" value={order.payerName || "未记录"} />
            <PaymentInfoItem label="金额" value={formatPaymentAmount(order.amount, order.currency)} />
            <PaymentInfoItem label="付款通道" value="银行电汇 / Bank Transfer" />
            <PaymentInfoItem label="付款方式" value={formatPaymentProvider(order.provider, order.paymentChannel)} />
            <PaymentInfoItem label="支付状态" value={paymentStatusText[order.status]} />
            <PaymentInfoItem label="创建时间" value={formatPaymentDateTime(order.createdAt)} />
            <PaymentInfoItem label="支付确认时间" value={formatPaymentDateTime(order.paidAt)} />
            <PaymentInfoItem label="取消时间" value={formatPaymentDateTime(order.cancelledAt)} />
          </div>
        </section>

        {needsManualConfirmation ? <ManualInstruction order={order} /> : null}

        <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row">
          <Link className="w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] sm:w-auto" href={`/payment/result?orderNo=${encodeURIComponent(order.orderNo)}`}>
            查看付款结果
          </Link>
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href={`/application/query?number=${encodeURIComponent(order.applicationNo)}`}>
            返回申请进度查询
          </Link>
        </div>
      </main>
    </>
  );
}

function PaymentEntryNotice() {
  return (
    <>
      <PageHero
        actions={[
          { label: "申请进度查询", href: "/application/query" },
          { label: "返回首页", href: "/", variant: "secondary" }
        ]}
        eyebrow="Payment"
        title="付款流程提示"
        subtitle="Payment Access"
        intro="请从申请进度查询页面进入支付流程。付款信息需与具体申请记录和订单记录关联，官网不提供脱离申请上下文的独立付款入口。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="支付事项需从申请进度或订单详情进入，便于核对申请编号、订单金额和付款状态。"
        visualEyebrow="Payment Notice"
        visualMark="PAY"
        visualSeal="付款"
        visualTitle="付款流程"
      />
      <main className="mx-auto w-full max-w-4xl min-w-0 overflow-x-hidden px-5 py-10 sm:px-8 lg:py-16">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Notice</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-porcelain">请从申请进度查询页面进入支付流程。</h1>
          <p className="mt-5">
            若您已提交个人会员、机构会员或认证申请，请使用申请编号和联系信息查询办理进度，并根据页面显示的订单说明进入付款流程。
          </p>
          <div className="mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className="w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] sm:w-auto" href="/application/query">
              前往申请进度查询
            </Link>
            <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href="/">
              返回首页
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function ManualInstruction({ order }: { order: PublicPaymentOrder }) {
  return (
    <section className="mt-8 min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Instruction</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">银行电汇说明</h2>
      <div className="mt-5 grid min-w-0 gap-4 text-sm leading-8 text-[#5f5b52]">
        <p>当前订单仅支持银行电汇 / 线下转账。请按协会秘书处通知的银行账户、金额和备注要求完成付款，并保留银行回执 / 付款凭证。</p>
        <p>付款后请回到申请查询页上传银行回执 / 付款凭证，等待财务后台审核。前台页面不会修改订单状态，也不会把订单标记为已付款。</p>
        <p className="break-words rounded-2xl border border-[#e4ded0] bg-white p-4 font-medium text-porcelain">付款备注建议填写：{order.orderNo} / {order.applicationNo}</p>
      </div>
    </section>
  );
}

function PaymentInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-[#eee7da] pb-4">
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-all text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}
