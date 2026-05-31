import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { listPaymentOrders, PaymentApiRequestError, PaymentApiUnauthorizedError, type PaymentOrderListItem, type PaymentStatus } from "@/lib/api/payments";
import { formatPaymentProvider } from "@/lib/payment-display";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "支付订单管理｜国际道教与文化协会 ITCA"
};

const statusOptions: Array<{ value: "" | PaymentStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "pending_payment", label: "待付款" },
  { value: "manual_review", label: "待人工确认" },
  { value: "paid", label: "已付款" },
  { value: "failed", label: "支付失败" },
  { value: "cancelled", label: "已取消" },
  { value: "expired", label: "已过期" },
  { value: "refunded", label: "已退款" }
];

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

export default async function AdminPaymentsPage({ searchParams }: { searchParams?: { status?: PaymentStatus; q?: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const status = statusOptions.some((item) => item.value === searchParams?.status) ? searchParams?.status : undefined;
  const q = searchParams?.q?.trim() || undefined;
  let orders: PaymentOrderListItem[] = [];
  let message = "";

  try {
    orders = await listPaymentOrders({ status, keyword: q });
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) redirect("/admin");
    if (error instanceof PaymentApiRequestError) {
      message = error.message;
    } else {
      message = "支付订单管理暂时无法读取数据，请确认 .NET API 与支付数据表已配置。";
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Payments</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">支付订单管理</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看人工确认 / 内部测试支付订单、付款状态和后台处理记录。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <form className="mt-8 grid gap-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">支付状态</span>
          <select className="form-input" defaultValue={status || ""} name="status">
            {statusOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">搜索</span>
          <input className="form-input" defaultValue={q || ""} name="q" placeholder="订单号 / 申请编号 / 付款人" />
        </label>
        <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" type="submit">筛选</button>
      </form>

      {message ? (
        <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate">
          <h2 className="font-serif text-2xl text-porcelain">支付订单暂不可用</h2>
          <p className="mt-3">{message}</p>
        </div>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] w-full table-fixed border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                <th className="w-[230px] border-b border-[#e4ded0] px-4 py-3 font-medium">订单编号</th>
                <th className="w-[190px] border-b border-[#e4ded0] px-4 py-3 font-medium">业务类型</th>
                <th className="w-[190px] border-b border-[#e4ded0] px-4 py-3 font-medium">关联业务编号</th>
                <th className="w-[160px] border-b border-[#e4ded0] px-4 py-3 font-medium">付款人</th>
                <th className="w-[130px] border-b border-[#e4ded0] px-4 py-3 font-medium">金额</th>
                <th className="w-[170px] border-b border-[#e4ded0] px-4 py-3 font-medium">支付方式</th>
                <th className="w-[140px] border-b border-[#e4ded0] px-4 py-3 font-medium">状态</th>
                <th className="w-[170px] border-b border-[#e4ded0] px-4 py-3 font-medium">时间</th>
                <th className="w-[100px] border-b border-[#e4ded0] px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={order.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="break-all font-medium leading-6 text-[#7F1D1D]">{order.orderNo}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#5f5b52]">{businessTypeText[order.businessType] || order.businessType}</td>
                  <td className="px-4 py-4 align-top">
                    <p className="break-all text-[#5f5b52]">{order.businessReference || "未关联"}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-porcelain">{order.payerName || "未记录"}</td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-porcelain">{formatMoney(order.amount)}</p>
                    <p className="mt-1 text-xs text-[#5f5b52]">{order.currency}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#5f5b52]">
                    <p>{formatPaymentProvider(order.provider, order.paymentChannel)}</p>
                    <p className="mt-1 text-xs">人工确认 / 内部测试支付订单</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex whitespace-nowrap rounded-full bg-[#fbf8ef] px-3 py-1.5 text-xs font-semibold text-[#8a6b3e]">{statusText[order.status] || order.status}</span>
                  </td>
                  <td className="px-4 py-4 align-top text-xs leading-6 text-[#5f5b52]">
                    <p>创建：{formatDateTime(order.createdAt)}</p>
                    <p>{order.paidAt ? `支付：${formatDateTime(order.paidAt)}` : `更新：${formatDateTime(order.updatedAt)}`}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-top">
                    <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/payments/${order.id}`}>查看详情</Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={9}>暂无符合条件的支付订单。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
