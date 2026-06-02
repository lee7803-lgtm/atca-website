import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminPageHeader, AdminSectionCard, AdminStatusBadge } from "@/components/admin/AdminUI";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createMasterDataEntry, listMasterDataEntries, MasterDataTableMissingError } from "@/lib/master-data";
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

  await createMasterDataEntry({
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
  revalidatePath("/admin/master-data");
}

export default async function AdminMasterDataPage() {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let entries: MasterDataEntry[] = [];
  let message = "";
  try {
    entries = await listMasterDataEntries({ limit: 200 });
  } catch (error) {
    message = error instanceof MasterDataTableMissingError ? "基础资料表尚未配置；请先执行 supabase/v1-3-stage13-master-data.sql。" : "基础资料暂时无法读取，请确认 Supabase 配置。";
  }

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
                {["类型", "显示名称", "分类", "地区", "来源", "状态", "更新时间"].map((item) => (
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
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={7}>暂无基础资料。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminSectionCard>
    </div>
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
          <label className="grid gap-2">
            <span className="text-sm font-medium text-porcelain">分类</span>
            <input className="form-input" name="type" placeholder={kind === "referee" ? "个人 / 机构" : "宫观 / 协会 / 学院"} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-porcelain">国家 / 地区</span>
            <input className="form-input" name="country" />
          </label>
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
