import type { PublicPaymentStatus } from "@/types/payment";

export const paymentStatusText: Record<PublicPaymentStatus, string> = {
  pending_payment: "待付款 / 待秘书处确认",
  manual_review: "秘书处核对中",
  paid: "付款已确认",
  failed: "付款未完成",
  cancelled: "订单已取消",
  expired: "订单已过期",
  refunded: "已退款"
};

export const paymentResultText: Record<PublicPaymentStatus, string> = {
  pending_payment: "等待付款 / 等待确认",
  manual_review: "秘书处正在人工核对",
  paid: "付款已确认",
  failed: "付款未完成",
  cancelled: "订单已取消",
  expired: "订单已过期",
  refunded: "已退款"
};

export const paymentBusinessTypeText: Record<string, string> = {
  personal_member_application: "个人会员申请",
  organization_member_application: "机构会员申请",
  taoist_certification_application: "道教文化认证建档申请",
  personal_member_renewal: "个人会员续期",
  organization_member_renewal: "机构会员续期",
  taoist_certification_renewal: "道教文化认证建档续期",
  taoist_certification_rereview: "道教文化认证建档复审",
  certificate_reissue: "证书补发",
  manual_adjustment: "人工调整"
};

export function formatPaymentProvider(provider: string, paymentChannel: string) {
  if (provider === "none") return "内部记录 / 暂不收款";
  if (provider === "manual") return paymentChannel === "bank_transfer" || paymentChannel === "manual" ? "银行电汇 / Bank Transfer" : "银行电汇 / Bank Transfer";
  return "银行电汇 / Bank Transfer";
}

export function formatPaymentDateTime(value?: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatPaymentAmount(amount: number, currency: string) {
  return `${currency} ${amount.toFixed(2)}`;
}
