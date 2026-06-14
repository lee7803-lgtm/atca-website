import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { AdminCsvExport } from "@/components/AdminCsvExport";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminApiUnauthorizedError, listAdminApplications } from "@/lib/api/admin-applications";
import { isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { ApplicationAdminRecord, ApplicationStatus, ApplicationType, RecordDisposition } from "@/types/application";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "会员申请管理｜国际道教与文化协会 ITCA"
};

const typeOptions: Array<{ value: "" | ApplicationType; label: string }> = [
  { value: "", label: "全部类型" },
  { value: "personal_member", label: "个人会员" },
  { value: "organization_member", label: "机构会员" }
];

const statusOptions: Array<{ value: "" | ApplicationStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "submitted", label: "已提交" },
  { value: "pending_review", label: "待审核" },
  { value: "under_review", label: "审核中" },
  { value: "need_more_info", label: "需补充资料" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "archived", label: "已建档" }
];

const validityOptions = [
  { value: "", label: "全部会员状态" },
  { value: "validity_not_set", label: "有效期未设置" },
  { value: "active", label: "有效" },
  { value: "expiring_soon", label: "即将到期" },
  { value: "expired", label: "已过期" },
  { value: "pending_renewal", label: "待续期" },
  { value: "renewal_in_progress", label: "续期中" },
  { value: "renewed", label: "已续期" },
  { value: "ended", label: "已终止 / 已撤销" }
];

const dispositionOptions: Array<{ value: RecordDisposition | "all"; label: string }> = [
  { value: "normal", label: "正常记录" },
  { value: "test", label: "测试记录" },
  { value: "archived", label: "归档记录" },
  { value: "voided", label: "作废记录" },
  { value: "all", label: "全部记录类型" }
];

const typeText: Record<ApplicationType, string> = {
  personal_member: "个人会员",
  organization_member: "机构会员"
};

const statusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  archived: "已建档"
};

const dispositionText: Record<RecordDisposition, string> = {
  normal: "正常",
  test: "测试",
  archived: "已归档",
  voided: "已作废"
};

const csvHeaders = ["申请编号", "会员编号", "姓名 / 机构名称", "邮箱", "手机号 / WhatsApp", "推荐人姓名", "推荐人联系方式", "推荐说明", "申请类型", "记录类型", "统一状态", "会员有效期", "提交时间", "更新时间"];

export default async function AdminApplicationsPage({ searchParams }: { searchParams?: { applicationType?: ApplicationType; status?: ApplicationStatus; recordDisposition?: RecordDisposition | "all"; validity?: string; q?: string } }) {
  requireAdminPage("applications:read");

  const applicationType = typeOptions.some((item) => item.value === searchParams?.applicationType) ? searchParams?.applicationType : undefined;
  const status = statusOptions.some((item) => item.value === searchParams?.status) ? searchParams?.status : undefined;
  const recordDisposition = dispositionOptions.some((item) => item.value === searchParams?.recordDisposition) ? searchParams?.recordDisposition || "normal" : "normal";
  const validity = validityOptions.some((item) => item.value === searchParams?.validity) ? searchParams?.validity || "" : "";
  const q = searchParams?.q?.trim() || undefined;
  let applications: ApplicationAdminRecord[] = [];
  let databaseMessage = "";

  try {
    applications = await listAdminApplications({ applicationType, status, recordDisposition, keyword: q });
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) {
      redirect("/admin");
    } else if (error instanceof SupabaseConfigError || isSupabaseSchemaError(error)) {
      databaseMessage = "会员申请资料服务尚未完成系统配置，请联系网站管理员处理。";
    } else if (error instanceof SupabaseRequestError) {
      databaseMessage = "会员申请数据暂时无法读取，请稍后重试或检查 Supabase 服务状态。";
    } else {
      databaseMessage = "会员申请管理暂时无法读取数据，请稍后重试。";
    }
  }

  applications = applications.filter((item) => {
    if (!validity) return true;
    if (validity === "ended") return item.memberEffectiveStatus === "terminated" || item.memberEffectiveStatus === "revoked";
    return item.memberEffectiveStatus === validity;
  });
  applications = applications.filter((item) => matchesKeyword(item, q));

  const csvRows = applications.map((item) => [
    item.applicationNo || "",
    item.memberNo || "",
    item.name || "",
    item.email || "",
    item.phone || "",
    item.referrerName || "",
    item.referrerContact || "",
    item.referrerNote || "",
    typeText[item.applicationType] || item.applicationType || "",
    dispositionText[item.recordDisposition] || item.recordDisposition || "正常",
    formatBusinessStatus(item),
    formatMemberValidity(item),
    item.createdAt || "",
    item.updatedAt || ""
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Applications</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">申请管理</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看个人会员与机构会员申请，按类型、状态、申请编号、姓名或推荐人筛选申请记录。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href="/admin">
            返回后台首页
          </Link>
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href="/">
            返回前台首页
          </Link>
          <AdminCsvExport headers={csvHeaders} filename="membership-applications.csv" rows={csvRows} />
          <AdminLogoutButton />
        </div>
      </div>

      {databaseMessage ? (
        <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate">
          <h2 className="font-serif text-2xl text-porcelain">会员申请数据表尚未配置</h2>
          <p className="mt-3">{databaseMessage}</p>
        </div>
      ) : null}

      <form className="mt-8 grid gap-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">申请类型</span>
          <select className="form-input" defaultValue={applicationType || ""} name="applicationType">
            {typeOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">记录类型</span>
          <select className="form-input" defaultValue={recordDisposition} name="recordDisposition">
            {dispositionOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">状态</span>
          <select className="form-input" defaultValue={status || ""} name="status">
            {statusOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">会员有效期状态</span>
          <select className="form-input" defaultValue={validity} name="validity">
            {validityOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">搜索</span>
          <input className="form-input" defaultValue={q || ""} name="q" placeholder="申请编号 / 姓名 / 推荐人" />
        </label>
        <button className="w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] md:w-auto" type="submit">
          筛选
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
        <div className="overflow-x-auto">
          <table className="min-w-[1360px] w-full table-fixed border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                <th className="w-[250px] border-b border-[#e4ded0] px-4 py-3 font-medium">申请 / 编号</th>
                <th className="w-[260px] border-b border-[#e4ded0] px-4 py-3 font-medium">名称 / 联系方式</th>
                <th className="w-[220px] border-b border-[#e4ded0] px-4 py-3 font-medium">推荐人</th>
                <th className="w-[110px] border-b border-[#e4ded0] px-4 py-3 font-medium">类型</th>
                <th className="w-[150px] border-b border-[#e4ded0] px-4 py-3 font-medium">统一状态</th>
                <th className="w-[210px] border-b border-[#e4ded0] px-4 py-3 font-medium">有效期</th>
                <th className="w-[150px] border-b border-[#e4ded0] px-4 py-3 font-medium">提交时间</th>
                <th className="w-[100px] border-b border-[#e4ded0] px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="break-all font-medium leading-6 text-[#7F1D1D]">{item.applicationNo}</p>
                    <p className="mt-1 break-all text-xs leading-5 text-[#5f5b52]">{item.memberNo || "审核通过后生成"}</p>
                    {item.recordDisposition !== "normal" ? <span className="mt-2 inline-flex whitespace-nowrap rounded-full border border-[#e4ded0] bg-[#fbf8ef] px-2.5 py-1 text-xs font-semibold text-[#7F1D1D]">{dispositionText[item.recordDisposition]}</span> : null}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium leading-6 text-porcelain">{item.name}</p>
                    <p className="mt-1 break-all text-xs leading-5 text-[#5f5b52]">{item.email}</p>
                    <p className="mt-1 whitespace-nowrap text-xs leading-5 text-[#5f5b52]">{item.phone}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-[#5f5b52]">
                    <p className="font-medium leading-6 text-porcelain">{item.referrerName || "未填写"}</p>
                    {item.referrerContact ? <p className="mt-1 break-all text-xs leading-5">{item.referrerContact}</p> : null}
                    {item.referrerNote ? <p className="mt-1 break-words text-xs leading-5">{item.referrerNote}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-top text-[#5f5b52]">{typeText[item.applicationType]}</td>
                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex whitespace-nowrap rounded-full bg-[#fbf8ef] px-3 py-1.5 text-xs font-semibold text-[#8a6b3e]">{formatBusinessStatus(item)}</span>
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <div className="whitespace-nowrap leading-7">
                      <div>{formatMemberValidityRange(item)}</div>
                      <div className="font-medium text-[#8a6b3e]">{formatMemberValidityStatus(item)}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-top text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-4 align-top">
                    <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/applications/${item.id}`}>查看详情</Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={8}>暂无符合条件的申请记录。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatMemberValidity(item: ApplicationAdminRecord) {
  const range = formatMemberValidityRange(item);
  const status = formatMemberValidityStatus(item);
  return range === "有效期未设置" ? range : `${range}\n${status}`;
}

function formatMemberValidityRange(item: ApplicationAdminRecord) {
  if (!item.memberValidFrom && !item.memberValidUntil) return "有效期未设置";
  if (item.memberValidFrom && item.memberValidUntil) return `${formatDateOnly(item.memberValidFrom)} - ${formatDateOnly(item.memberValidUntil)}`;
  return `${item.memberValidFrom ? formatDateOnly(item.memberValidFrom) : "未设置"} - ${item.memberValidUntil ? formatDateOnly(item.memberValidUntil) : "未设置"}`;
}

function formatMemberValidityStatus(item: ApplicationAdminRecord) {
  if (!item.memberValidFrom && !item.memberValidUntil) return "";
  if (item.memberEffectiveStatus === "expiring_soon" && typeof item.daysUntilExpiry === "number") {
    return `即将到期 · 剩余 ${Math.max(item.daysUntilExpiry, 0)} 天`;
  }

  return item.memberEffectiveStatusLabel || "有效期未设置";
}

function formatBusinessStatus(item: ApplicationAdminRecord) {
  if (item.memberEffectiveStatus === "revoked") return "已撤销";
  if (item.memberEffectiveStatus === "terminated") return "已终止";
  if (item.memberEffectiveStatus === "suspended") return "已暂停";
  if (["expired", "expiring_soon", "pending_renewal", "renewal_in_progress", "renewed"].includes(item.memberEffectiveStatus)) {
    return item.memberEffectiveStatusLabel;
  }
  if ((item.status === "approved" || item.status === "archived") && item.memberEffectiveStatus === "active") {
    return `${statusText[item.status]} · 有效`;
  }

  return statusText[item.status] || "状态待确认";
}

function matchesKeyword(item: ApplicationAdminRecord, keyword?: string) {
  if (!keyword) return true;
  const normalized = keyword.toLowerCase();
  return [
    item.applicationNo,
    item.memberNo,
    item.name,
    item.contactName,
    item.email,
    item.phone,
    item.referrerName,
    item.referrerContact,
    item.referrerNote
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalized));
}

function formatDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
