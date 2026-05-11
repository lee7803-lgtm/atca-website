import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { listApplications } from "@/lib/supabase/server";
import type { ApplicationStatus, ApplicationType } from "@/types/application";

export const dynamic = "force-dynamic";

const typeOptions: Array<{ value: "" | ApplicationType; label: string }> = [
  { value: "", label: "全部类型" },
  { value: "personal_member", label: "个人会员" },
  { value: "organization_member", label: "机构会员" }
];

const statusOptions: Array<{ value: "" | ApplicationStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "submitted", label: "已提交" },
  { value: "pending_review", label: "待审核" },
  { value: "need_more_info", label: "需补充资料" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "未通过" }
];

const typeText: Record<ApplicationType, string> = {
  personal_member: "个人会员",
  organization_member: "机构会员"
};

const statusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "未通过"
};

export default async function AdminApplicationsPage({ searchParams }: { searchParams?: { applicationType?: ApplicationType; status?: ApplicationStatus } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const applicationType = typeOptions.some((item) => item.value === searchParams?.applicationType) ? searchParams?.applicationType : undefined;
  const status = statusOptions.some((item) => item.value === searchParams?.status) ? searchParams?.status : undefined;
  const applications = await listApplications({ applicationType, status });

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Applications</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">申请管理</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看个人会员与机构会员申请，按类型和状态筛选申请记录。</p>
        </div>
        <AdminLogoutButton />
      </div>

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
                {["申请编号", "类型", "名称", "邮箱", "电话", "国家 / 地区", "状态", "提交时间", "操作"].map((item) => (
                  <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={item}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 font-medium text-[#7F1D1D]">{item.applicationNo}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{typeText[item.applicationType]}</td>
                  <td className="px-4 py-4 text-porcelain">{item.name}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.email}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.phone}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.country}</td>
                  <td className="px-4 py-4 text-[#8a6b3e]">{statusText[item.status]}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-4">
                    <Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/applications/${item.id}`}>查看详情</Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={9}>暂无符合条件的申请记录。</td>
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
