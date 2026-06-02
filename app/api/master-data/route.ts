import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createAuditLog } from "@/lib/admin/audit-logs";
import { createMasterDataEntry, listMasterDataEntries, MasterDataTableMissingError, updateMasterDataEntry } from "@/lib/master-data";
import type { MasterDataKind } from "@/types/master-data";

const validKinds: MasterDataKind[] = ["referee", "organization"];

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseKind(value: string | null): MasterDataKind | undefined {
  return validKinds.includes(value as MasterDataKind) ? (value as MasterDataKind) : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = parseKind(url.searchParams.get("kind"));
  if (!kind) return NextResponse.json({ success: false, message: "基础资料类型不正确。", items: [] }, { status: 400 });

  try {
    const items = await listMasterDataEntries({ kind, publicOnly: url.searchParams.get("public") !== "false" });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error instanceof MasterDataTableMissingError) {
      return NextResponse.json({ success: true, items: [], message: "基础资料表尚未配置。" });
    }
    return NextResponse.json({ success: true, items: [], message: "基础资料暂时无法读取。" });
  }
}

export async function POST(request: Request) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) {
    return NextResponse.json({ success: false, message: "未登录或登录已失效。" }, { status: 401 });
  }

  const formData = await request.formData();
  const kind = parseKind(asString(formData.get("kind")));
  const name = asString(formData.get("name"));
  if (!kind || !name) return NextResponse.json({ success: false, message: "请填写基础资料类型和名称。" }, { status: 400 });

  try {
    const entry = await createMasterDataEntry({
      kind,
      name,
      displayName: asString(formData.get("displayName")) || name,
      type: asString(formData.get("type")),
      country: asString(formData.get("country")),
      region: asString(formData.get("region")),
      phone: asString(formData.get("phone")),
      email: asString(formData.get("email")),
      internalNote: asString(formData.get("internalNote")),
      source: asString(formData.get("source")) === "applicant_submitted" ? "applicant_submitted" : "admin_created",
      reviewStatus: "approved",
      status: "active"
    });
    await writeAudit("master_data.create", entry?.id || "", name, `新增基础资料 ${name}。`);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    if (error instanceof MasterDataTableMissingError) {
      return NextResponse.json({ success: false, message: "基础资料表尚未配置，请先执行 SQL。" }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: "基础资料暂时无法保存。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) {
    return NextResponse.json({ success: false, message: "未登录或登录已失效。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string; name?: string; displayName?: string; type?: string; country?: string; region?: string; status?: string; reviewStatus?: string; note?: string; internalNote?: string } | null;
  if (!body?.id || !body.name?.trim()) return NextResponse.json({ success: false, message: "请填写基础资料 ID 和名称。" }, { status: 400 });

  try {
    const entry = await updateMasterDataEntry(body.id, {
      name: body.name,
      displayName: body.displayName || body.name,
      type: body.type || "",
      country: body.country || "",
      region: body.region || "",
      status: body.status === "inactive" ? "inactive" : "active",
      reviewStatus: body.reviewStatus === "pending" || body.reviewStatus === "rejected" ? body.reviewStatus : "approved",
      note: body.note || "",
      internalNote: body.internalNote || ""
    });
    await writeAudit("master_data.update", body.id, body.displayName || body.name, `更新基础资料 ${body.displayName || body.name}。`);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    if (error instanceof MasterDataTableMissingError) {
      return NextResponse.json({ success: false, message: "基础资料表尚未配置，请先执行 SQL。" }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: "基础资料暂时无法保存。" }, { status: 500 });
  }
}

async function writeAudit(action: string, resourceId: string, resourceNo: string, summary: string) {
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
