import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { checkCertificatesTableConfigured, isSupabaseSchemaError, listCertificationApplications, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { CertificationApplicationAdminRecord, CertificationStatus } from "@/types/certification";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "认证申请管理｜国际道教与文化协会 ITCA"
};

const statusOptions: Array<{ value: "" | CertificationStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "submitted", label: "已提交" },
  { value: "under_review", label: "审核中" },
  { value: "need_more_info", label: "需补充资料" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "certificate_issued", label: "已生成证书" },
  { value: "cert_issued", label: "已生成证书（旧）" },
  { value: "delivered", label: "已下发" },
  { value: "archived", label: "已归档" },
  { value: "revoked", label: "已撤销" }
];

const statusText = Object.fromEntries(statusOptions.filter((item) => item.value).map((item) => [item.value, item.label])) as Record<CertificationStatus, string>;

export default async function AdminCertificationApplicationsPage({ searchParams }: { searchParams?: { status?: CertificationStatus; q?: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const status = statusOptions.some((item) => item.value === searchParams?.status) ? searchParams?.status : undefined;
  const q = searchParams?.q?.trim() || undefined;
  let applications: CertificationApplicationAdminRecord[] = [];
  let databaseMessage = "";
  let certificateDatabaseMessage = "";

  try {
    applications = await listCertificationApplications({ status, q });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      databaseMessage = "认证申请资料服务尚未完成系统配置，请联系网站管理员处理。";
    } else if (isSupabaseSchemaError(error)) {
      databaseMessage = "认证申请资料服务尚未完成系统配置，请联系网站管理员处理。";
    } else if (error instanceof SupabaseRequestError) {
      databaseMessage = "认证申请数据暂时无法读取，请稍后重试或检查 Supabase 服务状态。";
    } else {
      databaseMessage = "认证申请管理暂时无法读取数据，请稍后重试。";
    }
  }

  if (!databaseMessage) {
    try {
      await checkCertificatesTableConfigured();
    } catch (error) {
      if (isSupabaseSchemaError(error)) {
        certificateDatabaseMessage = "证书记录服务尚未完成系统配置，生成证书功能可能受影响。";
      } else if (error instanceof SupabaseConfigError) {
        certificateDatabaseMessage = "证书记录服务尚未完成系统配置，生成证书功能可能受影响。";
      } else {
        certificateDatabaseMessage = "证书数据表暂时无法读取，生成证书功能可能受影响。";
      }
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certification Applications</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">认证申请管理</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看道士资格认证申请，按状态、申请编号、姓名或道名筛选申请记录。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/">返回前台首页</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <form className="mt-8 grid gap-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">状态</span>
          <select className="form-input" defaultValue={status || ""} name="status">
            {statusOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">搜索</span>
          <input className="form-input" defaultValue={q || ""} name="q" placeholder="申请编号 / 姓名 / 道名" />
        </label>
        <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" type="submit">筛选</button>
      </form>

      {databaseMessage ? (
        <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate">
          <h2 className="font-serif text-2xl text-porcelain">认证申请数据表尚未配置</h2>
          <p className="mt-3">{databaseMessage}</p>
        </div>
      ) : null}
      {certificateDatabaseMessage ? (
        <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate">
          <h2 className="font-serif text-2xl text-porcelain">证书数据表尚未配置</h2>
          <p className="mt-3">{certificateDatabaseMessage}</p>
        </div>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>{["申请编号", "姓名", "道名 / 法名", "道派", "状态", "提交时间", "操作"].map((item) => <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={item}>{item}</th>)}</tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 font-medium text-[#7F1D1D]">{item.applicationNo}</td>
                  <td className="px-4 py-4 text-porcelain">{item.applicantName}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.taoistName}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.sect || item.lineage}</td>
                  <td className="px-4 py-4 text-[#8a6b3e]">{statusText[item.status]}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-4"><Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/certification-applications/${item.id}`}>查看详情</Link></td>
                </tr>
              ))}
              {applications.length === 0 ? <tr><td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={7}>暂无符合条件的认证申请。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
