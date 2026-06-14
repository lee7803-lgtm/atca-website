import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { AdminCsvExport } from "@/components/AdminCsvExport";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { checkCertificatesTableConfigured, findCertificateByApplicationId, isSupabaseSchemaError, listCertificationApplications, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import { formatCertificationApplicationStatus, hasSupplementRecord } from "@/lib/status-labels";
import { certificationLevelLabels, certificationPathLabels, type CertificateQueryResult, type CertificationApplicationAdminRecord, type CertificationPath, type CertificationRecordDisposition, type CertificationStatus } from "@/types/certification";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "认证申请管理｜国际道教与文化协会 ITCA"
};

type StatusFilter = "" | CertificationStatus | "supplement_review";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "submitted", label: "已提交" },
  { value: "under_review", label: "审核中" },
  { value: "supplement_review", label: "已补充，审核中" },
  { value: "need_more_info", label: "需补充资料" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "certificate_issued", label: "已生成证书" },
  { value: "cert_issued", label: "已生成证书" },
  { value: "delivered", label: "已下发" },
  { value: "archived", label: "已建档" },
  { value: "revoked", label: "已撤销" }
];

const dispositionOptions: Array<{ value: CertificationRecordDisposition | "all"; label: string }> = [
  { value: "normal", label: "正常记录" },
  { value: "test", label: "测试记录" },
  { value: "archived", label: "归档记录" },
  { value: "voided", label: "作废记录" },
  { value: "all", label: "全部记录类型" }
];

const dispositionText: Record<CertificationRecordDisposition, string> = {
  normal: "正常",
  test: "测试",
  archived: "已归档",
  voided: "已作废"
};

type CertificationApplicationExportRecord = CertificationApplicationAdminRecord & {
  certificateNoForExport: string;
};

const csvHeaders = ["申请编号", "推荐人姓名", "推荐人联系方式", "推荐关系 / 推荐说明", "申请人姓名", "道名 / 法名", "邮箱", "手机号 / WhatsApp", "道派 / 传承体系", "申报认证等级", "核定传承体系", "核定认证等级", "记录类型", "当前状态", "证书编号", "下发状态", "是否有附件", "附件数量", "提交时间", "更新时间"];

export default async function AdminCertificationApplicationsPage({ searchParams }: { searchParams?: { status?: StatusFilter; recordDisposition?: CertificationRecordDisposition | "all"; q?: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const selectedStatus = statusOptions.some((item) => item.value === searchParams?.status) ? searchParams?.status : undefined;
  const status = selectedStatus === "supplement_review" ? "under_review" : selectedStatus || undefined;
  const recordDisposition = dispositionOptions.some((item) => item.value === searchParams?.recordDisposition) ? searchParams?.recordDisposition || "normal" : "normal";
  const q = searchParams?.q?.trim() || undefined;
  let applications: CertificationApplicationAdminRecord[] = [];
  let exportRows: CertificationApplicationExportRecord[] = [];
  let certificateByApplicationId = new Map<string, CertificateQueryResult>();
  let databaseMessage = "";
  let certificateDatabaseMessage = "";

  try {
    applications = await listCertificationApplications({ status: status as CertificationStatus | undefined, q, recordDisposition });
    if (selectedStatus === "supplement_review") {
      applications = applications.filter((item) => item.status === "under_review" && hasSupplementRecord(item));
    } else if (selectedStatus === "under_review") {
      applications = applications.filter((item) => !hasSupplementRecord(item));
    }
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
      const certificateEntries = await Promise.all(
        applications.map(async (item) => {
          try {
            const certificate = await findCertificateByApplicationId(item.id);
            return [item.id, certificate] as const;
          } catch {
            return [item.id, null] as const;
          }
        })
      );
      certificateByApplicationId = new Map(certificateEntries.filter((entry): entry is readonly [string, CertificateQueryResult] => Boolean(entry[1])));
      exportRows = applications.map((item) => ({
        ...item,
        certificateNoForExport: certificateByApplicationId.get(item.id)?.certificateNo || ""
      }));
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
  if (exportRows.length === 0) {
    exportRows = applications.map((item) => ({ ...item, certificateNoForExport: "" }));
  }
  const csvRows = exportRows.map((item) => [
    item.applicationNo || "",
    item.recommenderName || "",
    item.recommenderContact || "",
    item.recommenderRelation || "",
    item.applicantName || "",
    item.taoistName || "",
    item.email || "",
    item.phone || "",
    formatLineageForCsv(item),
    item.requestedLevel || "",
    item.approvedPath || "",
    item.approvedLevel || "",
    dispositionText[item.recordDisposition || "normal"] || item.recordDisposition || "正常",
    formatCertificationApplicationStatus(item),
    item.certificateNoForExport || "",
    item.deliveryStatus === "delivered" ? "已下发" : "未下发",
    item.existingCertificates.length + item.supportingDocuments.length > 0 ? "是" : "否",
    String(item.existingCertificates.length + item.supportingDocuments.length),
    item.createdAt || "",
    item.updatedAt || ""
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certification Applications</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">认证申请管理</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看道教文化认证建档申请，按状态、申请编号、姓名、道名或推荐人筛选申请记录。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href="/admin">返回后台首页</Link>
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink sm:w-auto" href="/">返回前台首页</Link>
          <AdminCsvExport headers={csvHeaders} filename="certification-applications.csv" rows={csvRows} />
          <AdminLogoutButton />
        </div>
      </div>

      <form className="mt-8 grid gap-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">状态</span>
          <select className="form-input" defaultValue={selectedStatus || ""} name="status">
            {statusOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">记录类型</span>
          <select className="form-input" defaultValue={recordDisposition} name="recordDisposition">
            {dispositionOptions.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">搜索</span>
          <input className="form-input" defaultValue={q || ""} name="q" placeholder="申请编号 / 姓名 / 道名 / 推荐人" />
        </label>
        <button className="w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] md:w-auto" type="submit">筛选</button>
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
          <table className="min-w-[1420px] w-full table-fixed border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                <th className="w-[220px] border-b border-[#e4ded0] px-4 py-3 font-medium">申请 / 证书</th>
                <th className="w-[220px] border-b border-[#e4ded0] px-4 py-3 font-medium">申请人 / 联系方式</th>
                <th className="w-[220px] border-b border-[#e4ded0] px-4 py-3 font-medium">推荐人</th>
                <th className="w-[220px] border-b border-[#e4ded0] px-4 py-3 font-medium">认证信息</th>
                <th className="w-[170px] border-b border-[#e4ded0] px-4 py-3 font-medium">统一状态</th>
                <th className="w-[210px] border-b border-[#e4ded0] px-4 py-3 font-medium">有效期</th>
                <th className="w-[150px] border-b border-[#e4ded0] px-4 py-3 font-medium">提交时间</th>
                <th className="w-[100px] border-b border-[#e4ded0] px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => {
                const certificate = certificateByApplicationId.get(item.id);

                return (
                  <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="break-all font-medium leading-6 text-[#7F1D1D]">{item.applicationNo}</p>
                      <p className="mt-1 break-all text-xs leading-5 text-[#5f5b52]">{certificate?.certificateNo || "审核通过后生成"}</p>
                      {item.recordDisposition && item.recordDisposition !== "normal" ? <span className="mt-2 inline-flex whitespace-nowrap rounded-full border border-[#e4ded0] bg-[#fbf8ef] px-2.5 py-1 text-xs font-semibold text-[#7F1D1D]">{dispositionText[item.recordDisposition]}</span> : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium leading-6 text-porcelain">{item.applicantName}</p>
                      <p className="mt-1 break-all text-xs leading-5 text-[#5f5b52]">{item.email}</p>
                      <p className="mt-1 whitespace-nowrap text-xs leading-5 text-[#5f5b52]">{item.phone}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-[#5f5b52]">
                      <p className="font-medium leading-6 text-porcelain">{item.recommenderName || "未填写"}</p>
                      {item.recommenderContact ? <p className="mt-1 break-all text-xs leading-5">{item.recommenderContact}</p> : null}
                      {item.recommenderRelation ? <p className="mt-1 break-words text-xs leading-5">{item.recommenderRelation}</p> : null}
                    </td>
                    <td className="px-4 py-4 align-top text-[#5f5b52]">
                      <p className="font-medium leading-6 text-porcelain">{formatCertificationType(item)}</p>
                      <p className="mt-1 break-words text-xs leading-5">道名 / 法名：{item.taoistName || "未填写"}</p>
                      <p className="mt-1 break-words text-xs leading-5">道派：{item.sect || item.lineage || "未填写"}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col items-start gap-2">
                        <span className="inline-flex whitespace-nowrap rounded-full bg-[#fbf8ef] px-3 py-1.5 text-xs font-semibold text-[#8a6b3e]">{formatUnifiedStatus(item, certificate)}</span>
                        {certificate ? <span className="inline-flex whitespace-nowrap rounded-full border border-[#e4ded0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5b52]">{item.deliveryStatus === "delivered" ? "已下发" : "未下发"}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-[#5f5b52]">
                      <div className="whitespace-nowrap leading-7">
                        <div>{formatCertificateValidityRange(certificate)}</div>
                        <div className="font-medium text-[#8a6b3e]">{formatCertificateValidityStatus(certificate)}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-top text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4 align-top"><Link className="font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/certification-applications/${item.id}`}>查看详情</Link></td>
                  </tr>
                );
              })}
              {applications.length === 0 ? <tr><td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={8}>暂无符合条件的认证申请。</td></tr> : null}
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

function formatDateOnly(value?: string | null) {
  if (!value) return "未设置";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function formatCertificationType(item: CertificationApplicationAdminRecord) {
  if (item.requestedLevel) return certificationLevelLabels[item.requestedLevel] || item.requestedLevel;
  if (item.approvedLevel) return certificationLevelLabels[item.approvedLevel] || item.approvedLevel;
  return "道教文化认证建档";
}

function formatUnifiedStatus(item: CertificationApplicationAdminRecord, certificate?: CertificateQueryResult) {
  if (certificate?.effectiveStatusLabel) return certificate.effectiveStatusLabel;
  if (certificate) return "已生成证书";
  return formatCertificationApplicationStatus(item);
}

function formatCertificateValidityRange(certificate?: CertificateQueryResult) {
  if (!certificate || (!certificate.validFrom && !certificate.validUntil)) return "有效期未设置";
  return `${formatDateOnly(certificate.validFrom)} - ${formatDateOnly(certificate.validUntil)}`;
}

function formatCertificateValidityStatus(certificate?: CertificateQueryResult) {
  if (!certificate) return "";
  if (certificate.effectiveStatus === "expiring_soon" && typeof certificate.daysUntilExpiry === "number") {
    return `即将到期 · 剩余 ${Math.max(certificate.daysUntilExpiry, 0)} 天`;
  }
  if (certificate.effectiveStatus === "expired") return "已过期";
  if (typeof certificate.daysUntilExpiry === "number" && certificate.daysUntilExpiry >= 0) return `剩余 ${certificate.daysUntilExpiry} 天`;
  return certificate.effectiveStatusLabel || "";
}

function formatLineageForCsv(item: CertificationApplicationAdminRecord) {
  if (item.lineage) return item.lineage;
  if (item.certificationPath) return certificationPathLabels[item.certificationPath as CertificationPath] || item.certificationPath;
  if (item.approvedPath) return certificationPathLabels[item.approvedPath as CertificationPath] || item.approvedPath;
  return "";
}
