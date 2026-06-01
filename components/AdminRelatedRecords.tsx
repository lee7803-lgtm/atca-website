import Link from "next/link";
import { formatPaymentProvider } from "@/lib/payment-display";
import { formatNotificationChannel, formatNotificationStatus, formatNotificationType, maskEmail, maskPhone } from "@/lib/notifications/format";
import type { PaymentOrderListItem, PaymentStatus } from "@/lib/api/payments";
import type { NotificationLogRecord } from "@/lib/notifications/types";

const paymentStatusText: Record<PaymentStatus, string> = {
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

export function RelatedPaymentRecords({ message = "", orders }: { message?: string; orders: PaymentOrderListItem[] }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Related Payments</p>
          <h2 className="mt-3 font-serif text-2xl text-porcelain">关联支付状态</h2>
        </div>
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href="/admin/payments">
          查看支付后台
        </Link>
      </div>
      {message ? <p className="mt-4 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-sm leading-7 text-[#5f5b52]">{message}</p> : null}
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[980px] w-full table-fixed border-collapse text-left text-sm">
          <thead className="text-[#5f5b52]">
            <tr>
              <th className="w-[180px] border-b border-[#e4ded0] px-3 py-3 font-medium">订单编号</th>
              <th className="w-[160px] border-b border-[#e4ded0] px-3 py-3 font-medium">业务类型</th>
              <th className="w-[120px] border-b border-[#e4ded0] px-3 py-3 font-medium">金额</th>
              <th className="w-[130px] border-b border-[#e4ded0] px-3 py-3 font-medium">支付状态</th>
              <th className="w-[170px] border-b border-[#e4ded0] px-3 py-3 font-medium">支付方式 / 渠道</th>
              <th className="w-[170px] border-b border-[#e4ded0] px-3 py-3 font-medium">时间</th>
              <th className="w-[90px] border-b border-[#e4ded0] px-3 py-3 font-medium">详情</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={order.id}>
                <td className="break-all px-3 py-4 align-top font-medium leading-6 text-[#7F1D1D]">{order.orderNo}</td>
                <td className="px-3 py-4 align-top text-[#5f5b52]">{businessTypeText[order.businessType] || order.businessType || "未记录"}</td>
                <td className="px-3 py-4 align-top">
                  <p className="font-medium text-porcelain">{formatMoney(order.amount)}</p>
                  <p className="mt-1 text-xs text-[#5f5b52]">{order.currency}</p>
                </td>
                <td className="px-3 py-4 align-top">
                  <span className="inline-flex whitespace-nowrap rounded-full bg-[#fbf8ef] px-3 py-1.5 text-xs font-semibold text-[#8a6b3e]">{paymentStatusText[order.status] || order.status}</span>
                </td>
                <td className="px-3 py-4 align-top text-[#5f5b52]">{formatPaymentProvider(order.provider, order.paymentChannel)}</td>
                <td className="px-3 py-4 align-top text-xs leading-6 text-[#5f5b52]">
                  <p>创建：{formatDateTime(order.createdAt)}</p>
                  <p>更新：{formatDateTime(order.updatedAt)}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-4 align-top">
                  <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/payments/${order.id}`}>查看</Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-[#5f5b52]" colSpan={7}>暂无关联支付订单。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RelatedNotificationRecords({ logs, message = "" }: { logs: NotificationLogRecord[]; message?: string }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Related Notifications</p>
          <h2 className="mt-3 font-serif text-2xl text-porcelain">关联通知记录</h2>
        </div>
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href="/admin/notifications">
          查看通知后台
        </Link>
      </div>
      {message ? <p className="mt-4 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-sm leading-7 text-[#5f5b52]">{message}</p> : null}
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[980px] w-full table-fixed border-collapse text-left text-sm">
          <thead className="text-[#5f5b52]">
            <tr>
              <th className="w-[170px] border-b border-[#e4ded0] px-3 py-3 font-medium">通知类型</th>
              <th className="w-[110px] border-b border-[#e4ded0] px-3 py-3 font-medium">渠道</th>
              <th className="w-[120px] border-b border-[#e4ded0] px-3 py-3 font-medium">发送状态</th>
              <th className="w-[180px] border-b border-[#e4ded0] px-3 py-3 font-medium">收件人</th>
              <th className="w-[170px] border-b border-[#e4ded0] px-3 py-3 font-medium">时间</th>
              <th className="w-[190px] border-b border-[#e4ded0] px-3 py-3 font-medium">错误摘要</th>
              <th className="w-[90px] border-b border-[#e4ded0] px-3 py-3 font-medium">详情</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={log.id}>
                <td className="px-3 py-4 align-top text-porcelain">
                  <p>{formatNotificationType(log.notificationType)}</p>
                  {log.templateKey ? <p className="mt-1 break-all text-xs text-[#8a6b3e]">{log.templateKey}</p> : null}
                </td>
                <td className="px-3 py-4 align-top text-[#5f5b52]">{formatNotificationChannel(log.channel)}</td>
                <td className="px-3 py-4 align-top">
                  <span className="inline-flex whitespace-nowrap rounded-full bg-[#fbf8ef] px-3 py-1.5 text-xs font-semibold text-[#8a6b3e]">{formatNotificationStatus(log.sendStatus)}</span>
                </td>
                <td className="px-3 py-4 align-top text-[#5f5b52]">
                  <p className="font-medium text-porcelain">{log.recipientName || "未记录"}</p>
                  <p className="mt-1 break-all text-xs">{maskEmail(log.recipientEmail) || "未记录邮箱"}</p>
                  <p className="mt-1 text-xs">{maskPhone(log.recipientPhone) || "未记录手机"}</p>
                </td>
                <td className="px-3 py-4 align-top text-xs leading-6 text-[#5f5b52]">
                  <p>创建：{formatDateTime(log.createdAt)}</p>
                  <p>状态：{formatDateTime(getNotificationStatusTime(log))}</p>
                </td>
                <td className="px-3 py-4 align-top text-[#5f5b52]">{summarizeError(log.errorMessage)}</td>
                <td className="whitespace-nowrap px-3 py-4 align-top">
                  <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/notifications">查看</Link>
                </td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-[#5f5b52]" colSpan={7}>暂无关联通知记录。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
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

function getNotificationStatusTime(log: NotificationLogRecord) {
  return log.sentAt || log.failedAt || log.skippedAt || log.scheduledAt || log.updatedAt || "";
}

function summarizeError(value: string) {
  if (!value) return "无";
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}
