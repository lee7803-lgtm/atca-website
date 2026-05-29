import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { AdminCsvExport } from "@/components/AdminCsvExport";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { AdminApiUnauthorizedError, listAdminApplications } from "@/lib/api/admin-applications";
import { isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import { formatApplicationStatus } from "@/lib/status-labels";
import type { ApplicationAdminRecord, ApplicationStatus, ApplicationType } from "@/types/application";

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

const csvHeaders = ["申请编号", "会员编号", "申请类型", "姓名 / 机构名称", "邮箱", "手机号 / WhatsApp", "当前状态", "提交时间", "更新时间"];

export default async function AdminApplicationsPage({ searchParams }: { searchParams?: { applicationType?: ApplicationType; status?: ApplicationStatus } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const applicationType = typeOptions.some((item) => item.value === searchParams?.applicationType) ? searchParams?.applicationType : undefined;
  const status = statusOptions.some((item) => item.value === searchParams?.status) ? searchParams?.status : undefined;
  let applications: ApplicationAdminRecord[] = [];
  let databaseMessage = "";

  try {
    applications = await listAdminApplications({ applicationType, status });
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

  const csvRows = applications.map((item) => [
    item.applicationNo || "",
    item.memberNo || "",
    typeText[item.applicationType] || item.applicationType || "",
    item.name || "",
    item.email || "",
    item.phone || "",
    formatApplicationStatus(item),
    item.createdAt || "",
    item.updatedAt || ""
  ]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Applications</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">申请管理</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看个人会员与机构会员申请，按类型和状态筛选申请记录。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin">
            返回后台首页
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/">
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

      <form className="mt-8 grid gap-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">申请类型</span>
          <select className="form-input" defaultValue={applicationType || ""} name="applicationType">
            {typeOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">状态</span>
          <select className="form-input" defaultValue={status || ""} name="status">
            {statusOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" type="submit">
          筛选
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                {["申请编号", "会员编号", "类型", "名称", "邮箱", "电话", "国家 / 地区", "状态", "提交时间", "操作"].map((item) => (
                  <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={item}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 font-medium text-[#7F1D1D]">{item.applicationNo}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.memberNo || "审核通过后生成"}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{typeText[item.applicationType]}</td>
                  <td className="px-4 py-4 text-porcelain">{item.name}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.email}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.phone}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.country}</td>
                  <td className="px-4 py-4 text-[#8a6b3e]">{formatApplicationStatus(item)}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-4">
                    <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/applications/${item.id}`}>查看详情</Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={10}>暂无符合条件的申请记录。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
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
