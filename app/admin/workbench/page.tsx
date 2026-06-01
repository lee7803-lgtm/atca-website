import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { AdminApiUnauthorizedError, listAdminApplications } from "@/lib/api/admin-applications";
import { listPaymentOrders, PaymentApiRequestError, PaymentApiUnauthorizedError, type PaymentOrderListItem, type PaymentStatus } from "@/lib/api/payments";
import { listNotificationLogs } from "@/lib/notifications/admin";
import { formatNotificationStatus, formatNotificationType } from "@/lib/notifications/format";
import { NotificationTableMissingError } from "@/lib/notifications/logger";
import type { NotificationLogRecord, NotificationSendStatus } from "@/lib/notifications/types";
import {
  checkCertificatesTableConfigured,
  findCertificateByApplicationId,
  findCertificatePdfMetadataByApplicationId,
  isSupabaseSchemaError,
  listCertificationApplications,
  SupabaseConfigError,
  SupabaseRequestError
} from "@/lib/supabase/server";
import type { ApplicationAdminRecord, ApplicationStatus, ApplicationType } from "@/types/application";
import type { CertificatePdfMetadata, CertificationApplicationAdminRecord, CertificationStatus } from "@/types/certification";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "审核工作台｜国际道教与文化协会 ITCA"
};

type WorkbenchSection = "member" | "certification" | "payment" | "notification";

type WorkbenchTodo = {
  id: string;
  section: WorkbenchSection;
  type: string;
  number: string;
  person: string;
  status: string;
  nextAction: string;
  time: string;
  href: string;
};

type SectionResult = {
  title: string;
  description: string;
  items: WorkbenchTodo[];
  message?: string;
};

const memberStatusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  archived: "已建档"
};

const memberTypeText: Record<ApplicationType, string> = {
  personal_member: "个人会员申请",
  organization_member: "机构会员申请"
};

const certificationStatusText: Record<CertificationStatus, string> = {
  submitted: "已提交",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  certificate_issued: "已生成证书",
  cert_issued: "已生成证书",
  delivered: "已下发",
  archived: "已建档",
  revoked: "已撤销"
};

const paymentStatusText: Record<PaymentStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  failed: "支付失败",
  cancelled: "已取消",
  expired: "已过期",
  manual_review: "待人工确认",
  refunded: "已退款"
};

const sectionTone: Record<WorkbenchSection, string> = {
  member: "bg-[#fbf8ef] text-[#8a6b3e]",
  certification: "bg-[#f4f7f3] text-[#476541]",
  payment: "bg-[#f8f1ee] text-[#7F1D1D]",
  notification: "bg-[#f4f2ed] text-[#66594d]"
};

export default async function AdminWorkbenchPage() {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const [memberResult, certificationResult, paymentResult, notificationResult] = await Promise.all([
    getMemberTodos(),
    getCertificationTodos(),
    getPaymentTodos(),
    getNotificationTodos()
  ]);
  const sections = [memberResult, certificationResult, paymentResult, notificationResult];
  const totalCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const notificationSkippedCount = notificationResult.items.filter((item) => item.status === formatNotificationStatus("skipped")).length;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Review Workbench</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">审核工作台</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[#5f5b52]">
            聚合会员申请、认证申请、支付订单与通知记录中的待办事项。本页仅做只读展示和详情页跳转，不执行审核、支付、证书或通知写操作。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {sections.map((section) => (
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate" key={section.title}>
            <p className="text-xs tracking-[0.22em] text-gold">{section.title}</p>
            <p className="mt-3 font-serif text-3xl text-porcelain">{section.items.length}</p>
            <p className="mt-2 text-xs leading-6 text-[#5f5b52]">{section.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
        当前共显示 {totalCount} 条只读待办；每个分区最多展示最近 50 条。通知 skipped 单独纳入统计，当前 {notificationSkippedCount} 条，不作为错误。
      </div>

      <div className="mt-8 grid gap-8">
        {sections.map((section) => (
          <TodoSection key={section.title} section={section} />
        ))}
      </div>
    </section>
  );
}

async function getMemberTodos(): Promise<SectionResult> {
  try {
    const applications = await listAdminApplications({ pageSize: 100 });
    const items = applications.flatMap(memberApplicationToTodos).sort(sortTodoByTime).slice(0, 50);

    return {
      title: "会员申请待办",
      description: "待审核、需补充、编号或有效期缺失",
      items
    };
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) redirect("/admin");
    return {
      title: "会员申请待办",
      description: "待审核、需补充、编号或有效期缺失",
      items: [],
      message: databaseReadMessage(error, "会员申请资料服务尚未完成系统配置，请联系网站管理员处理。", "会员申请数据暂时无法读取，请稍后重试。")
    };
  }
}

async function getCertificationTodos(): Promise<SectionResult> {
  try {
    const applications = await listCertificationApplications();
    let message = "";
    let certificateTableAvailable = true;

    try {
      await checkCertificatesTableConfigured();
    } catch (error) {
      if (error instanceof SupabaseConfigError || isSupabaseSchemaError(error)) {
        certificateTableAvailable = false;
        message = "证书数据表尚未配置；本工作台暂不判断证书生成和 PDF 生成待办。";
      } else {
        throw error;
      }
    }

    const entries = await Promise.all(applications.map((item) => certificationApplicationToTodos(item, certificateTableAvailable)));
    const items = entries.flat().sort(sortTodoByTime).slice(0, 50);

    return {
      title: "认证申请待办",
      description: "审核、证书、PDF、下发与建档状态",
      items,
      message
    };
  } catch (error) {
    return {
      title: "认证申请待办",
      description: "审核、证书、PDF、下发与建档状态",
      items: [],
      message: databaseReadMessage(error, "认证申请或证书资料服务尚未完成系统配置，请联系网站管理员处理。", "认证申请数据暂时无法读取，请稍后重试。")
    };
  }
}

async function getPaymentTodos(): Promise<SectionResult> {
  try {
    const orders = await listPaymentOrders({ pageSize: 100 });
    const items = orders.flatMap(paymentOrderToTodos).sort(sortTodoByTime).slice(0, 50);

    return {
      title: "支付待办",
      description: "待付款、人工确认与失败订单",
      items
    };
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) redirect("/admin");
    return {
      title: "支付待办",
      description: "待付款、人工确认与失败订单",
      items: [],
      message: error instanceof PaymentApiRequestError ? error.message : "支付订单暂时无法读取，请确认支付服务和数据表已配置。"
    };
  }
}

async function getNotificationTodos(): Promise<SectionResult> {
  try {
    const logs = await listNotificationLogs({ limit: 50 });
    const items = logs.flatMap(notificationLogToTodos).sort(sortTodoByTime).slice(0, 50);

    return {
      title: "通知待办",
      description: "失败、待发送与 skipped 统计",
      items
    };
  } catch (error) {
    return {
      title: "通知待办",
      description: "失败、待发送与 skipped 统计",
      items: [],
      message: error instanceof NotificationTableMissingError ? "通知记录表尚未配置；本工作台会在配置完成后显示通知待办。" : "通知记录暂时无法读取，请确认通知服务和数据表已配置。"
    };
  }
}

function memberApplicationToTodos(application: ApplicationAdminRecord): WorkbenchTodo[] {
  const todos: WorkbenchTodo[] = [];
  const base = {
    section: "member" as const,
    type: memberTypeText[application.applicationType] || "会员申请",
    number: application.applicationNo,
    person: application.name || application.contactName || "未记录",
    time: application.updatedAt || application.createdAt,
    href: `/admin/applications/${application.id}`
  };

  if (["submitted", "pending_review", "under_review", "need_more_info"].includes(application.status)) {
    todos.push({
      ...base,
      id: `member-status-${application.id}`,
      status: memberStatusText[application.status],
      nextAction: getMemberNextAction(application.status)
    });
  }
  if (application.status === "approved" && !application.memberNo) {
    todos.push({
      ...base,
      id: `member-no-${application.id}`,
      status: "已通过 / 会员编号缺失",
      nextAction: "进入会员申请详情，补齐会员编号。"
    });
  }
  if (application.status === "approved" && (!application.memberValidFrom || !application.memberValidUntil)) {
    todos.push({
      ...base,
      id: `member-validity-${application.id}`,
      status: "已通过 / 有效期未设置",
      nextAction: "进入会员申请详情，设置会员有效期。"
    });
  }

  return todos;
}

async function certificationApplicationToTodos(application: CertificationApplicationAdminRecord, certificateTableAvailable: boolean): Promise<WorkbenchTodo[]> {
  const todos: WorkbenchTodo[] = [];
  const certificate = certificateTableAvailable ? await readCertificateSafe(application.id) : null;
  const pdfMetadata = certificate && ["certificate_issued", "cert_issued"].includes(application.status) ? await readCertificatePdfMetadataSafe(application.id) : null;
  const base = {
    section: "certification" as const,
    type: "认证申请",
    number: application.applicationNo,
    person: application.applicantName || application.taoistName || "未记录",
    time: application.updatedAt || application.createdAt,
    href: `/admin/certification-applications/${application.id}`
  };

  if (["submitted", "under_review", "need_more_info"].includes(application.status)) {
    todos.push({
      ...base,
      id: `cert-status-${application.id}`,
      status: certificationStatusText[application.status],
      nextAction: getCertificationNextAction(application.status)
    });
  }
  if (certificateTableAvailable && application.status === "approved" && !certificate) {
    todos.push({
      ...base,
      id: `cert-missing-${application.id}`,
      status: "已通过 / 证书未生成",
      nextAction: "进入认证申请详情，检查资料后生成证书。"
    });
  }
  if (certificateTableAvailable && ["certificate_issued", "cert_issued"].includes(application.status) && certificate && !isPdfGenerated(pdfMetadata)) {
    todos.push({
      ...base,
      id: `cert-pdf-${application.id}`,
      status: "已生成证书 / PDF 未生成",
      nextAction: "进入认证申请详情，生成证书 PDF。"
    });
  }
  if (["certificate_issued", "cert_issued"].includes(application.status) && application.deliveryStatus !== "delivered") {
    todos.push({
      ...base,
      id: `cert-delivery-${application.id}`,
      status: "已生成证书 / 未下发",
      nextAction: "进入认证申请详情，确认下发状态。"
    });
  }
  if (application.status === "delivered") {
    todos.push({
      ...base,
      id: `cert-archive-${application.id}`,
      status: "已下发 / 未建档",
      nextAction: "进入认证申请详情，确认归档条件。"
    });
  }

  return todos;
}

function paymentOrderToTodos(order: PaymentOrderListItem): WorkbenchTodo[] {
  if (!["pending_payment", "manual_review", "failed"].includes(order.status)) return [];

  return [
    {
      id: `payment-${order.id}`,
      section: "payment",
      type: "支付订单",
      number: order.orderNo,
      person: order.payerName || "未记录",
      status: paymentStatusText[order.status],
      nextAction: getPaymentNextAction(order.status),
      time: order.updatedAt || order.createdAt,
      href: `/admin/payments/${order.id}`
    }
  ];
}

function notificationLogToTodos(log: NotificationLogRecord): WorkbenchTodo[] {
  if (!["failed", "pending", "skipped"].includes(log.sendStatus)) return [];

  return [
    {
      id: `notification-${log.id}`,
      section: "notification",
      type: formatNotificationType(log.notificationType),
      number: log.applicationNo || log.memberNo || log.certificateNo || log.id,
      person: log.recipientName || "未记录",
      status: formatNotificationStatus(log.sendStatus),
      nextAction: getNotificationNextAction(log.sendStatus),
      time: log.updatedAt || log.failedAt || log.scheduledAt || log.createdAt,
      href: "/admin/notifications"
    }
  ];
}

async function readCertificateSafe(applicationId: string) {
  try {
    return await findCertificateByApplicationId(applicationId);
  } catch (error) {
    if (isSupabaseSchemaError(error) || error instanceof SupabaseConfigError) return null;
    throw error;
  }
}

async function readCertificatePdfMetadataSafe(applicationId: string) {
  try {
    return await findCertificatePdfMetadataByApplicationId(applicationId);
  } catch (error) {
    if (isSupabaseSchemaError(error) || error instanceof SupabaseConfigError) return null;
    throw error;
  }
}

function isPdfGenerated(metadata: CertificatePdfMetadata | null) {
  return Boolean(metadata?.hasPdf && metadata.status === "generated");
}

function getMemberNextAction(status: ApplicationStatus) {
  if (status === "need_more_info") return "等待或检查申请人补充资料。";
  if (status === "submitted" || status === "pending_review") return "进入申请详情，开展初审。";
  if (status === "under_review") return "继续审核并记录审核结论。";
  return "进入申请详情查看。";
}

function getCertificationNextAction(status: CertificationStatus) {
  if (status === "need_more_info") return "等待或检查申请人补充材料。";
  if (status === "submitted") return "进入认证详情，开展材料初审。";
  if (status === "under_review") return "继续材料审核或委员会审核。";
  return "进入认证详情查看。";
}

function getPaymentNextAction(status: PaymentStatus) {
  if (status === "manual_review") return "进入支付详情，人工核对付款凭证。";
  if (status === "failed") return "进入支付详情，确认失败原因或后续处理。";
  return "等待付款或检查订单关联记录。";
}

function getNotificationNextAction(status: NotificationSendStatus) {
  if (status === "failed") return "进入通知记录页，检查失败原因。";
  if (status === "pending") return "进入通知记录页，确认是否需要人工发送。";
  return "skipped 仅统计，不作为错误处理。";
}

function databaseReadMessage(error: unknown, configMessage: string, requestMessage: string) {
  if (error instanceof SupabaseConfigError || isSupabaseSchemaError(error)) return configMessage;
  if (error instanceof SupabaseRequestError) return requestMessage;
  return requestMessage;
}

function sortTodoByTime(a: WorkbenchTodo, b: WorkbenchTodo) {
  return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
}

function TodoSection({ section }: { section: SectionResult }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
      <div className="flex flex-col gap-2 border-b border-[#e4ded0] bg-[#fbf8ef] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-porcelain">{section.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#5f5b52]">{section.description}</p>
        </div>
        <p className="text-sm font-semibold text-[#8a6b3e]">{section.items.length} 条</p>
      </div>
      {section.message ? (
        <div className="border-b border-[#e4ded0] bg-[#fffdf8] px-5 py-4 text-sm leading-7 text-[#5f5b52]">{section.message}</div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full table-fixed border-collapse text-left text-sm">
          <thead className="text-[#5f5b52]">
            <tr>
              <th className="w-[130px] border-b border-[#e4ded0] px-4 py-3 font-medium">类型</th>
              <th className="w-[220px] border-b border-[#e4ded0] px-4 py-3 font-medium">编号</th>
              <th className="w-[170px] border-b border-[#e4ded0] px-4 py-3 font-medium">申请人 / 付款人 / 接收人</th>
              <th className="w-[180px] border-b border-[#e4ded0] px-4 py-3 font-medium">当前状态</th>
              <th className="w-[280px] border-b border-[#e4ded0] px-4 py-3 font-medium">建议下一步动作</th>
              <th className="w-[160px] border-b border-[#e4ded0] px-4 py-3 font-medium">创建或更新时间</th>
              <th className="w-[100px] border-b border-[#e4ded0] px-4 py-3 font-medium">详情</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                <td className="px-4 py-4 align-top">
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${sectionTone[item.section]}`}>{item.type}</span>
                </td>
                <td className="break-all px-4 py-4 align-top font-medium leading-6 text-[#7F1D1D]">{item.number || "未记录"}</td>
                <td className="break-words px-4 py-4 align-top text-porcelain">{item.person}</td>
                <td className="px-4 py-4 align-top text-[#5f5b52]">{item.status}</td>
                <td className="px-4 py-4 align-top leading-7 text-[#5f5b52]">{item.nextAction}</td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-[#5f5b52]">{formatDateTime(item.time)}</td>
                <td className="whitespace-nowrap px-4 py-4 align-top">
                  <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={item.href}>查看详情</Link>
                </td>
              </tr>
            ))}
            {section.items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={7}>暂无待办记录。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "未记录";
  return new Date(value).toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
