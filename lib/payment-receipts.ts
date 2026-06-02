import "server-only";

import { createAuditLog } from "@/lib/admin/audit-logs";
import { createNotificationLog } from "@/lib/notifications/logger";
import type { AdminSession } from "@/lib/admin/auth";

const receiptBucket = "payment-receipts";
const maxReceiptSize = 2 * 1024 * 1024;
const allowedReceiptTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

type Config = {
  url: string;
  serviceRoleKey: string;
};

type ReceiptReviewStatus = "pending_review" | "approved" | "rejected";

function getConfig(): Config {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Payment receipt storage is not configured.");
  return { url, serviceRoleKey };
}

function restHeaders(config: Config, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

export function getPaymentReceiptFileError(file: File) {
  if (!allowedReceiptTypes.has(file.type)) return "付款凭证仅支持 PDF、JPG、PNG。";
  if (file.size <= 0) return "付款凭证文件为空。";
  if (file.size > maxReceiptSize) return "付款凭证单文件不能超过 2MB。";
  return "";
}

export async function uploadPaymentReceipt(input: { orderId: string; orderNo: string; applicationNo: string; file: File }) {
  const config = getConfig();
  const fileError = getPaymentReceiptFileError(input.file);
  if (fileError) throw new Error(fileError);

  const extension = getExtension(input.file);
  const storagePath = `${sanitizePathSegment(input.applicationNo)}/${sanitizePathSegment(input.orderNo)}/${Date.now()}-${randomSuffix()}${extension}`;
  const response = await fetch(`${config.url}/storage/v1/object/${receiptBucket}/${storagePath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": input.file.type,
      "x-upsert": "false"
    },
    body: Buffer.from(await input.file.arrayBuffer())
  });
  if (!response.ok) throw new Error("付款凭证暂时无法上传。");

  const now = new Date().toISOString();
  await patchPaymentOrderReceipt(input.orderId, {
    receipt_file_path: storagePath,
    receipt_file_name: sanitizeFileName(input.file.name),
    receipt_file_mime_type: input.file.type,
    receipt_file_size: input.file.size,
    receipt_uploaded_at: now,
    receipt_review_status: "pending_review",
    receipt_reviewed_at: null,
    receipt_reviewed_by: null,
    receipt_review_note: null
  });
  await writePaymentEvent(input.orderId, input.orderNo, "付款凭证已上传，等待财务审核。", "receipt_uploaded");

  return {
    fileName: sanitizeFileName(input.file.name),
    uploadedAt: now,
    reviewStatus: "pending_review"
  };
}

export async function reviewPaymentReceipt(input: {
  orderId: string;
  orderNo: string;
  applicationNo?: string;
  nextStatus: ReceiptReviewStatus;
  note: string;
  actor?: AdminSession | null;
  ipAddress?: string;
  userAgent?: string;
}) {
  const now = new Date().toISOString();
  const actorLabel = input.actor?.email || input.actor?.displayName || "admin";
  await patchPaymentOrderReceipt(input.orderId, {
    receipt_review_status: input.nextStatus,
    receipt_reviewed_at: now,
    receipt_reviewed_by: actorLabel,
    receipt_review_note: input.note || null
  });
  await writePaymentEvent(input.orderId, input.orderNo, input.nextStatus === "approved" ? "财务已确认付款凭证。" : "付款凭证未通过，需重新上传。", input.nextStatus === "approved" ? "receipt_approved" : "receipt_rejected", input.note);
  await createAuditLog({
    actorAdminId: input.actor?.adminId,
    actorEmail: input.actor?.email,
    actorName: input.actor?.displayName || "Legacy Admin",
    actorRole: input.actor?.role || "admin",
    actorType: input.actor?.actorType || "legacy_admin",
    action: input.nextStatus === "approved" ? "payment_receipt.approve" : "payment_receipt.reject",
    resourceType: "payment_order",
    resourceId: input.orderId,
    resourceNo: input.orderNo,
    afterData: { receiptReviewStatus: input.nextStatus },
    summary: input.nextStatus === "approved" ? `支付订单 ${input.orderNo} 付款凭证已通过。` : `支付订单 ${input.orderNo} 付款凭证未通过。`,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  }).catch(() => undefined);
  await createNotificationLog({
    notificationType: input.nextStatus === "approved" ? "payment.receipt_approved" : "payment.receipt_rejected",
    channel: "system",
    sendStatus: "skipped",
    idempotencyKey: `payment-receipt:${input.orderNo}:${input.nextStatus}:${now}`,
    applicationNo: input.applicationNo || "",
    sourceType: "payment_order",
    sourceAction: input.nextStatus,
    messageBody: input.nextStatus === "approved" ? `支付订单 ${input.orderNo} 付款凭证已通过。` : `支付订单 ${input.orderNo} 付款凭证未通过，需重新上传。`,
    templateKey: `payment.${input.nextStatus}`,
    provider: "none",
    createdBy: actorLabel,
    skippedAt: now
  }).catch(() => undefined);
}

export async function createPaymentReceiptSignedUrl(storagePath: string) {
  const config = getConfig();
  if (!storagePath || storagePath.includes("..")) throw new Error("付款凭证路径无效。");
  const response = await fetch(`${config.url}/storage/v1/object/sign/${receiptBucket}/${storagePath}`, {
    method: "POST",
    headers: restHeaders(config),
    body: JSON.stringify({ expiresIn: 300 })
  });
  if (!response.ok) throw new Error("付款凭证查看链接暂时无法生成。");
  const result = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = result.signedURL || result.signedUrl || "";
  if (!signedPath) throw new Error("付款凭证查看链接暂时无法生成。");
  return signedPath.startsWith("http") ? signedPath : `${config.url}${signedPath}`;
}

async function patchPaymentOrderReceipt(orderId: string, body: Record<string, unknown>) {
  const config = getConfig();
  const response = await fetch(`${config.url}/rest/v1/payment_orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: restHeaders(config, "return=minimal"),
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error("付款凭证状态暂时无法保存，请确认付款凭证 SQL 已执行。");
}

async function writePaymentEvent(orderId: string, orderNo: string, message: string, marker: string, adminNote = "") {
  const config = getConfig();
  await fetch(`${config.url}/rest/v1/payment_events`, {
    method: "POST",
    headers: restHeaders(config),
    body: JSON.stringify({
      payment_order_id: orderId,
      order_no: orderNo,
      event_type: "admin_note",
      provider: "manual",
      message,
      admin_note: adminNote,
      payload_json: { marker },
      created_by: "system"
    })
  }).catch(() => undefined);
}

function getExtension(file: File) {
  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "image/png") return ".png";
  return ".jpg";
}

function sanitizePathSegment(value: string) {
  return value.trim().replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 120) || "unknown";
}

function sanitizeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|\r\n]/g, "-").slice(0, 180) || "payment-receipt";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}
