import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminPageHeader, AdminSectionCard, AdminStatusBadge } from "@/components/admin/AdminUI";
import { SearchableSelectWithOther } from "@/components/SearchableSelectWithOther";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createAuditLog } from "@/lib/admin/audit-logs";
import { getAdminSession } from "@/lib/admin/auth";
import { createMasterDataEntry, listMasterDataEntries, MasterDataTableMissingError, updateMasterDataEntry } from "@/lib/master-data";
import { countryRegionOptions, organizationMasterTypeOptions, refereeTypeOptions } from "@/lib/select-options";
import type { MasterDataEntry, MasterDataKind } from "@/types/master-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "基础资料｜国际道教与文化协会 ITCA"
};

const kindText: Record<MasterDataKind, string> = {
  referee: "引荐人 / 推荐人",
  organization: "宫观 / 机构 / 所属组织"
};

async function createMasterDataAction(formData: FormData) {
  "use server";

  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");
  const kind = String(formData.get("kind") || "") as MasterDataKind;
  const name = String(formData.get("name") || "").trim();
  if (!["referee", "organization"].includes(kind) || !name) return;

  const entry = await createMasterDataEntry({
    kind,
    name,
    displayName: String(formData.get("displayName") || "").trim() || name,
    type: String(formData.get("type") || "").trim(),
    country: String(formData.get("country") || "").trim(),
    internalNote: String(formData.get("internalNote") || "").trim(),
    source: "admin_created",
    status: "active",
    reviewStatus: "approved"
  });
  await writeMasterDataAudit("master_data.create", entry?.id || "", name, `新增基础资料 ${name}。`);
  revalidatePath("/admin/master-data");
}

async function updateMasterDataAction(formData: FormData) {
  "use server";

  const adminCookie = cookies().get(adminSessionCookieName)?.value;
  if (!isValidAdminSessionToken(adminCookie)) redirect("/admin");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim() || name;
  if (!id || !name) return;
  const entry = await updateMasterDataEntry(id, {
    name,
    displayName,
    type: String(formData.get("type") || "").trim(),
    country: String(formData.get("country") || "").trim(),
    region: String(formData.get("region") || "").trim(),
    status: String(formData.get("status") || "active") === "inactive" ? "inactive" : "active",
    reviewStatus: ["pending", "approved", "rejected"].includes(String(formData.get("reviewStatus"))) ? (String(formData.get("reviewStatus")) as "pending" | "approved" | "rejected") : "approved",
    note: String(formData.get("note") || "").trim(),
    internalNote: String(formData.get("internalNote") || "").trim()
  });
  await writeMasterDataAudit("master_data.update", id, displayName, `更新基础资料 ${displayName}。`);
  if (entry?.status === "inactive") await writeMasterDataAudit("master_data.disable", id, displayName, `停用基础资料 ${displayName}。`);
  revalidatePath("/admin/master-data");
}

async function writeMasterDataAudit(action: string, resourceId: string, resourceNo: string, summary: string) {
  const actor = getAdminSession(cookies().get(adminSessionCookieName)?.value);
  await createAuditLog({
    actorAdminId: actor?.adminId,
    actorEmail: actor?.email,
    actorName: actor?.displayName || "Legacy Admin",
    actorRole: actor?.role || "admin",
    actorType: actor?.actorType || "legacy_admin",
    action,
    resourceType: "master_data_entry",
    resourceId,
    resourceNo,
    summary
  }).catch(() => undefined);
}

export default async function AdminMasterDataPage({ searchParams }: { searchParams?: { edit?: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let entries: MasterDataEntry[] = [];
  let message = "";
  try {
    entries = await listMasterDataEntries({ limit: 200 });
  } catch (error) {
    message = error instanceof MasterDataTableMissingError ? "基础资料表尚未配置；请先执行 supabase/v1-3-stage13-master-data.sql。" : "基础资料暂时无法读取，请确认 Supabase 配置。";
  }
  const selectedEntry = entries.find((item) => item.id === searchParams?.edit) || null;

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader
        eyebrow="Master Data"
        intro="维护审核会频繁使用的推荐人、引荐人、宫观、机构与所属组织。前台表单读取已启用且审核通过的条目；申请人仍可选择其他并填写。"
        title="基础资料"
      />
      {message ? <div className="border-l-4 border-[#8a6b3e] bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">{message}</div> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <CreateMasterDataForm kind="referee" />
        <CreateMasterDataForm kind="organization" />
      </div>
      <AdminSectionCard title="资料条目">
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                {["类型", "显示名称", "分类", "地区", "来源", "状态", "更新时间", "操作"].map((item) => (
                  <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={item}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 text-porcelain">{kindText[item.kind]}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-[#7F1D1D]">{item.displayName}</p>
                    <p className="mt-1 text-xs text-[#5f5b52]">{item.name}</p>
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.type || "未分类"}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{[item.country, item.region].filter(Boolean).join(" / ") || "未记录"}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.source}</td>
                  <td className="px-4 py-4"><AdminStatusBadge tone={item.status === "active" && item.reviewStatus === "approved" ? "success" : "warning"}>{item.status} / {item.reviewStatus}</AdminStatusBadge></td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(item.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <a className="rounded-full border border-[#d8d0bf] bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={`/admin/master-data?edit=${encodeURIComponent(item.id)}#master-data-editor`}>
                      编辑 / 维护
                    </a>
                  </td>
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={8}>暂无基础资料。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminSectionCard>
      {selectedEntry ? <MasterDataEditSection entry={selectedEntry} /> : null}
    </div>
  );
}

function MasterDataEditSection({ entry }: { entry: MasterDataEntry }) {
  return (
    <AdminSectionCard title={`正在维护：${entry.displayName}`} id="master-data-editor">
      <form action={updateMasterDataAction} className="mt-5 grid gap-4 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 lg:grid-cols-4">
        <input name="id" type="hidden" value={entry.id} />
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">名称</span>
          <input className="form-input" name="name" required defaultValue={entry.name} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">显示名称</span>
          <input className="form-input" name="displayName" defaultValue={entry.displayName} />
        </label>
        <div>
          <SearchableSelectWithOther label="分类" name="type" options={entry.kind === "referee" ? refereeTypeOptions : organizationMasterTypeOptions} value={entry.type} />
        </div>
        <div>
          <SearchableSelectWithOther label="国家 / 地区" name="country" options={countryRegionOptions} value={entry.country} />
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">区域</span>
          <input className="form-input" name="region" defaultValue={entry.region} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">状态</span>
          <select className="form-input" name="status" defaultValue={entry.status}>
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">审核状态</span>
          <select className="form-input" name="reviewStatus" defaultValue={entry.reviewStatus}>
            <option value="approved">通过</option>
            <option value="pending">待审核</option>
            <option value="rejected">不通过</option>
          </select>
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="text-sm font-medium text-porcelain">公开备注</span>
          <input className="form-input" name="note" defaultValue={entry.note} />
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="text-sm font-medium text-porcelain">内部备注</span>
          <input className="form-input" name="internalNote" defaultValue={entry.internalNote} />
        </label>
        <div className="flex flex-col gap-3 lg:col-span-4 sm:flex-row">
          <button className="rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white" type="submit">保存修改</button>
          <a className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin/master-data">
            取消编辑 / 关闭编辑
          </a>
        </div>
      </form>
    </AdminSectionCard>
  );
}

function CreateMasterDataForm({ kind }: { kind: MasterDataKind }) {
  return (
    <AdminSectionCard title={`新增${kindText[kind]}`}>
      <form action={createMasterDataAction} className="mt-5 grid gap-4">
        <input name="kind" type="hidden" value={kind} />
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">名称</span>
          <input className="form-input" name="name" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">显示名称</span>
          <input className="form-input" name="displayName" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchableSelectWithOther label="分类" name="type" options={kind === "referee" ? refereeTypeOptions : organizationMasterTypeOptions} value="" />
          <SearchableSelectWithOther label="国家 / 地区" name="country" options={countryRegionOptions} value="" />
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-porcelain">内部备注</span>
          <textarea className="form-input min-h-24" name="internalNote" />
        </label>
        <button className="w-full rounded-full bg-[#7F1D1D] px-5 py-3 text-sm font-semibold text-white sm:w-auto" type="submit">
          保存基础资料
        </button>
      </form>
    </AdminSectionCard>
  );
}

function formatDateTime(value: string) {
  if (!value) return "未记录";
  return new Date(value).toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
