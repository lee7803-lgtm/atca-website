import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { formatPaymentAmount, formatPaymentDateTime, paymentResultText } from "@/lib/payment-display";
import { findPublicPaymentOrderByOrderNo } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({ searchParams }: { searchParams: { orderNo?: string } }) {
  const orderNo = searchParams.orderNo?.trim() || "";
  const order = orderNo ? await findPublicPaymentOrderByOrderNo(orderNo) : null;
  if (!order) notFound();

  return (
    <>
      <PageHero
        actions={[
          { label: "付款说明", href: `/payment/checkout?orderNo=${encodeURIComponent(order.orderNo)}` },
          { label: "申请查询", href: "/application/query" }
        ]}
        eyebrow="Payment Result"
        title="付款状态"
        subtitle="Payment Status"
        intro="本页面仅展示当前订单状态，不通过 URL 参数或前台操作变更付款结果。"
        imageSrc="/images/itca/05-service-verification.png"
        imagePosition="center 58%"
        visualDescription="付款确认由财务后台审核银行回执后处理。"
        visualEyebrow="Result"
        visualMark="PAY"
        visualSeal="状态"
        visualTitle={paymentResultText[order.status]}
      />
      <main className="mx-auto w-full max-w-4xl min-w-0 overflow-x-hidden px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Status</p>
          <h1 className="mt-3 font-serif text-4xl text-porcelain">{paymentResultText[order.status]}</h1>
          <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-2">
            <ResultItem label="支付订单编号" value={order.orderNo} />
            <ResultItem label="关联申请编号" value={order.applicationNo || "未记录"} />
            <ResultItem label="金额" value={formatPaymentAmount(order.amount, order.currency)} />
            <ResultItem label="创建时间" value={formatPaymentDateTime(order.createdAt)} />
            <ResultItem label="支付确认时间" value={formatPaymentDateTime(order.paidAt)} />
            <ResultItem label="取消时间" value={formatPaymentDateTime(order.cancelledAt)} />
          </div>
          <p className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
            如您已完成银行电汇，请在申请查询页上传银行回执 / 付款凭证，并等待财务后台审核。前台结果页不会提交支付、不会修改订单状态。
          </p>
        </section>
        <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row">
          <Link className="w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] sm:w-auto" href={`/payment/checkout?orderNo=${encodeURIComponent(order.orderNo)}`}>
            查看付款说明
          </Link>
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href={`/application/query?number=${encodeURIComponent(order.applicationNo)}`}>
            返回申请进度查询
          </Link>
        </div>
      </main>
    </>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-[#eee7da] pb-4">
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-all text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}
