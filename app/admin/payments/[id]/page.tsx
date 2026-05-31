import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PaymentStatusActions } from "./PaymentStatusActions";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getPaymentOrder, PaymentApiRequestError, PaymentApiUnauthorizedError, type PaymentEvent, type PaymentOrderDetail, type PaymentStatus } from "@/lib/api/payments";

export const dynamic = "force-dynamic";

const statusText: Record<PaymentStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  failed: "支付失败",
  cancelled: "已取消",
  expired: "已过期",
  manual_review: "待人工确认",
  refunded: "已退款"
};

const businessTypeText: Record<string, string> = {
  personal_member_application: "个人会员申请",
  organization_member_application: "机构会员申请",
  taoist_certification_application: "道士认证申请",
  personal_member_renewal: "个人会员续期",
  organization_member_renewal: "机构会员续期",
  taoist_certification_renewal: "道士认证续期",
  taoist_certification_rereview: "道士认证复审",
  certificate_reissue: "证书补发",
  manual_adjustment: "人工调整"
};

export default async function AdminPaymentDetailPage({ params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let order: PaymentOrderDetail | null = null;
  let message = "";

  try {
    order = await getPaymentOrder(params.id);
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) redirect("/admin");
    if (error instanceof PaymentApiRequestError) {
      message = error.message;
    } else {
      message = "支付订单详情暂时无法读取，请确认 .NET API 与支付数据表已配置。";
    }
  }

  if (!order && !message) notFound();

  if (!order) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/payments">返回支付管理</Link>
        <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate">
          <h1 className="font-serif text-3xl text-porcelain">支付订单暂不可用</h1>
          <p className="mt-3">{message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/payments">返回支付管理</Link>
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
      </div>

      <section className="mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Payment Detail</p>
        <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{order.orderNo}</h1>
        <div className="mt-5 flex flex-wrap gap-3">
          <Badge>{businessTypeText[order.businessType] || order.businessType}</Badge>
          <Badge>{statusText[order.status] || order.status}</Badge>
          <Badge>{order.provider} / {order.paymentChannel}</Badge>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="grid gap-6">
          <DetailSection title="订单信息">
            <DetailItem label="订单编号" value={order.orderNo} />
            <DetailItem label="业务类型" value={businessTypeText[order.businessType] || order.businessType} />
            <DetailItem label="业务 ID" value={order.businessId || "未记录"} />
            <DetailItem label="支付状态" value={statusText[order.status] || order.status} />
            <DetailItem label="金额" value={`${formatMoney(order.amount)} ${order.currency}`} />
            <DetailItem label="费用代码" value={order.feeCode || "未记录"} />
          </DetailSection>

          <DetailSection title="业务关联">
            <DetailItem label="申请记录 ID" value={order.applicationId || "未关联"} />
            <DetailItem label="认证申请 ID" value={order.certificationApplicationId || "未关联"} />
            <DetailItem label="证书 ID" value={order.certificateId || "未关联"} />
            <DetailItem label="申请编号" value={order.applicationNo || "未记录"} />
            <DetailItem label="会员编号" value={order.memberNo || "未记录"} />
            <DetailItem label="证书编号" value={order.certificateNo || "未记录"} />
          </DetailSection>

          <DetailSection title="付款人">
            <DetailItem label="付款人姓名" value={order.payerName || "未记录"} />
            <DetailItem label="付款人邮箱" value={order.payerEmail || "未记录"} />
            <DetailItem label="付款人电话" value={order.payerPhone || "未记录"} />
            <DetailItem label="创建来源" value={order.createdBy || "system"} />
          </DetailSection>

          <DetailSection title="渠道与第三方编号">
            <DetailItem label="Provider" value={order.provider} />
            <DetailItem label="支付渠道" value={order.paymentChannel || "manual"} />
            <DetailItem label="支付方式" value={order.paymentMethod || "未记录"} />
            <DetailItem label="Provider Order ID" value={order.providerOrderId || "未记录"} />
            <DetailItem label="Provider Transaction ID" value={order.providerTransactionId || "未记录"} />
            <DetailItem label="Provider Payment ID" value={order.providerPaymentId || "未记录"} />
            <DetailItem label="Provider Callback ID" value={order.providerCallbackId || "未记录"} />
          </DetailSection>

          <DetailSection title="时间记录">
            <DetailItem label="创建时间" value={formatDateTime(order.createdAt)} />
            <DetailItem label="更新时间" value={formatDateTime(order.updatedAt)} />
            <DetailItem label="支付时间" value={formatDateTime(order.paidAt)} />
            <DetailItem label="失败时间" value={formatDateTime(order.failedAt)} />
            <DetailItem label="取消时间" value={formatDateTime(order.cancelledAt)} />
            <DetailItem label="过期时间" value={formatDateTime(order.expiredAt)} />
            <DetailItem label="退款时间" value={formatDateTime(order.refundedAt)} />
            <DetailItem label="人工确认时间" value={formatDateTime(order.manualReviewAt)} />
            <DetailItem label="确认时间" value={formatDateTime(order.confirmedAt)} />
            <DetailItem label="确认人" value={order.confirmedBy || "未记录"} />
          </DetailSection>

          <DetailSection title="备注">
            <DetailItem className="md:col-span-2" label="付款说明" value={order.paymentProofNote || "无"} />
            <DetailItem className="md:col-span-2" label="后台备注" value={order.adminNote || "无"} />
            <DetailItem className="md:col-span-2" label="内部备注" value={order.internalNote || "无"} />
            <DetailItem className="md:col-span-2" label="取消原因" value={order.cancelReason || "无"} />
            <DetailItem className="md:col-span-2" label="退款原因" value={order.refundReason || "无"} />
          </DetailSection>

          <DetailSection title="Provider Payload">
            <pre className="md:col-span-2 max-h-[360px] overflow-auto rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#5f5b52]">{formatJson(order.providerPayload)}</pre>
          </DetailSection>

          <PaymentTimeline events={order.events} />
        </div>

        <div className="grid gap-6">
          <PaymentStatusActions orderId={order.id} status={order.status} />
        </div>
      </div>
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#fbf8ef] px-4 py-2 text-sm font-semibold text-[#8a6b3e]">{children}</span>;
}

function DetailItem({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`border-b border-[#eee7da] pb-4 ${className}`}>
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function PaymentTimeline({ events }: { events: PaymentEvent[] }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <h2 className="font-serif text-2xl text-porcelain">事件时间线</h2>
      <div className="mt-5 grid gap-4">
        {events.map((event) => (
          <div className="border-l-4 border-[#8a6b3e] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]" key={event.id}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <p className="font-medium text-porcelain">{event.eventType}</p>
              <p className="text-xs">{formatDateTime(event.createdAt)}</p>
            </div>
            <p className="mt-1">状态：{event.fromStatus || "无"} → {event.toStatus || "无"}</p>
            <p className="mt-1">Provider：{event.provider}</p>
            <p className="mt-1">操作人：{event.createdBy || "system"}</p>
            {event.message ? <p className="mt-1">{event.message}</p> : null}
            {event.adminNote ? <p className="mt-1">备注：{event.adminNote}</p> : null}
          </div>
        ))}
        {events.length === 0 ? <p className="text-sm leading-7 text-[#5f5b52]">暂无支付事件。</p> : null}
      </div>
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "未记录";
  return new Date(value).toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatJson(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "{}";
  return JSON.stringify(value, null, 2)
    .replace(/(service[_-]?role|admin[_-]?token|connection[_-]?string|payment[_-]?secret|storage[_-]?path|verification[_-]?token|核验 token)[^",}]*/gi, "$1: [redacted]")
    .slice(0, 12000);
}
