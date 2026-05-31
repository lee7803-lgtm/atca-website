import { NextResponse } from "next/server";
import { findApplicationSupplementTarget, findCertificationSupplementTarget, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { PublicPaymentOrder } from "@/types/payment";

const memberBusinessTypes = ["personal_member_renewal", "organization_member_renewal"] as const;
const certificationBusinessTypes = ["taoist_certification_renewal", "taoist_certification_rereview"] as const;
const validBusinessTypes = [...memberBusinessTypes, ...certificationBusinessTypes] as const;
const activeStatuses = "pending_payment,manual_review,paid";
const orderNoAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

type RenewalOrderRequest = {
  applicationNo?: string;
  contact?: string;
  businessType?: string;
  amount?: number | string;
  currency?: string;
};

type SourceRecord = {
  id: string;
  applicationNo: string;
  memberNo?: string | null;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  sourceType: "application" | "certification_application";
};

export async function POST(request: Request) {
  let body: RenewalOrderRequest;
  try {
    body = (await request.json()) as RenewalOrderRequest;
  } catch {
    return NextResponse.json({ success: false, message: "续期 / 复审订单资料格式不正确。" }, { status: 400 });
  }

  const applicationNo = body.applicationNo?.trim() || "";
  const contact = body.contact?.trim() || "";
  const businessType = body.businessType?.trim() || "";
  const amount = Number(body.amount ?? 0);
  const currency = (body.currency || "USD").trim().toUpperCase();

  if (!applicationNo || !contact) {
    return NextResponse.json({ success: false, message: "请先使用申请编号和登记联系方式完成本人查询。" }, { status: 400 });
  }

  if (!validBusinessTypes.includes(businessType as (typeof validBusinessTypes)[number])) {
    return NextResponse.json({ success: false, message: "请选择有效的续期 / 复审业务类型。" }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ success: false, message: "支付金额不能小于 0。" }, { status: 400 });
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ success: false, message: "币种必须使用 3 位大写 ISO 代码。" }, { status: 400 });
  }

  try {
    const source = await resolveSource(applicationNo, contact, businessType);
    if (!source) return notFoundResponse();

    const result = await createRenewalReviewOrder(source, businessType, amount, currency);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof SupabaseConfigError || isSupabaseSchemaError(error)) {
      return NextResponse.json({ success: false, message: "申请查询服务尚未完成系统配置，请联系协会秘书处协助办理。" }, { status: 500 });
    }
    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "申请查询服务暂时无法访问数据库，请稍后重试。" }, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }
    if (error instanceof PaymentRouteError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, message: "续期 / 复审订单创建服务暂时不可用。" }, { status: 500 });
  }
}

async function resolveSource(applicationNo: string, contact: string, businessType: string): Promise<SourceRecord | null> {
  if (memberBusinessTypes.includes(businessType as (typeof memberBusinessTypes)[number])) {
    const application = await findApplicationSupplementTarget(applicationNo, contact);
    if (!application) return null;

    if (businessType === "personal_member_renewal" && application.applicationType !== "personal_member") {
      throw new PaymentRouteError("该申请不能生成个人会员续期订单。", 400);
    }

    if (businessType === "organization_member_renewal" && application.applicationType !== "organization_member") {
      throw new PaymentRouteError("该申请不能生成机构会员续期订单。", 400);
    }

    return {
      id: application.id,
      applicationNo: application.applicationNo,
      memberNo: application.memberNo || null,
      payerName: application.contactName || application.name,
      payerEmail: application.email,
      payerPhone: application.phone,
      sourceType: "application"
    };
  }

  const application = await findCertificationSupplementTarget(applicationNo, contact);
  if (!application) return null;

  return {
    id: application.id,
    applicationNo: application.applicationNo,
    memberNo: null,
    payerName: application.applicantName,
    payerEmail: application.email,
    payerPhone: application.phone,
    sourceType: "certification_application"
  };
}

async function createRenewalReviewOrder(source: SourceRecord, businessType: string, amount: number, currency: string) {
  const existing = await findExistingActiveOrder(source, businessType);
  if (existing) {
    return {
      created: false,
      message: existing.status === "paid" ? "该业务记录已有已付款订单，不能重复生成。" : "该业务记录已有有效支付订单。",
      order: existing
    };
  }

  const orderNo = await generateOrderNo();
  const orderRow = await insertPaymentOrder(source, businessType, amount, currency, orderNo);
  await insertPaymentEvent(orderRow);
  await insertAuditLog(orderRow);
  await insertNotificationLog(orderRow, source);

  return {
    created: true,
    message: "支付订单已生成。",
    order: toPublicPaymentOrder(orderRow)
  };
}

async function findExistingActiveOrder(source: SourceRecord, businessType: string) {
  const params = new URLSearchParams({
    select: publicOrderSelect,
    business_type: `eq.${businessType}`,
    application_no: `eq.${source.applicationNo}`,
    status: `in.(${activeStatuses})`,
    order: "created_at.desc",
    limit: "1"
  });

  const rows = await supabaseGet<PaymentOrderRow>("payment_orders", params);
  return rows[0] ? toPublicPaymentOrder(rows[0]) : null;
}

async function insertPaymentOrder(source: SourceRecord, businessType: string, amount: number, currency: string, orderNo: string) {
  const now = new Date().toISOString();
  const row = {
    order_no: orderNo,
    business_type: businessType,
    business_id: source.id,
    application_id: source.sourceType === "application" ? source.id : null,
    certification_application_id: source.sourceType === "certification_application" ? source.id : null,
    application_no: source.applicationNo,
    member_no: source.memberNo || null,
    payer_name: source.payerName,
    payer_email: source.payerEmail,
    payer_phone: source.payerPhone,
    amount,
    currency,
    fee_code: "renewal_review_fee",
    payment_channel: "manual",
    provider: "manual",
    status: "pending_payment",
    admin_note: `Applicant requested ${businessType}.`,
    metadata: { sourceType: source.sourceType, createdFrom: "applicant_query_renewal_review" },
    created_by: "applicant",
    created_at: now,
    updated_at: now
  };

  const rows = await supabasePost<PaymentOrderRow>("payment_orders", row);
  return rows[0];
}

async function insertPaymentEvent(order: PaymentOrderRow) {
  await supabasePost("payment_events", {
    payment_order_id: order.id,
    order_no: order.order_no,
    event_type: "order_created",
    from_status: null,
    to_status: "pending_payment",
    provider: order.provider,
    idempotency_key: `payment-event:${order.order_no}:order_created:pending_payment`,
    message: `支付订单 ${order.order_no} 已创建。`,
    admin_note: "Applicant requested renewal or review payment.",
    payload_json: {
      orderNo: order.order_no,
      businessType: order.business_type,
      toStatus: "pending_payment",
      provider: order.provider,
      actor: "applicant"
    },
    created_by: "applicant"
  });
}

async function insertAuditLog(order: PaymentOrderRow) {
  await supabasePost("audit_logs", {
    actor_email: null,
    actor_name: "Applicant",
    actor_role: null,
    actor_type: "system",
    action: "payment_order.create",
    resource_type: "payment_order",
    resource_id: order.id,
    resource_no: order.order_no,
    before_data: null,
    after_data: toPublicPaymentOrder(order),
    summary: `申请人本人校验后生成续期 / 复审支付订单 ${order.order_no}。`,
    ip_address: null,
    user_agent: null
  });
}

async function insertNotificationLog(order: PaymentOrderRow, source: SourceRecord) {
  await supabasePost("notification_logs", {
    notification_type: order.business_type.includes("rereview") ? "rereview.payment_required" : "renewal.payment_required",
    channel: "system",
    send_status: "skipped",
    idempotency_key: `payment:${order.order_no}:order_created`,
    application_id: source.sourceType === "application" ? source.id : null,
    certification_application_id: source.sourceType === "certification_application" ? source.id : null,
    application_no: source.applicationNo,
    member_no: source.memberNo || null,
    source_type: "payment_order",
    source_action: "order_created",
    recipient_name: source.payerName,
    recipient_email: source.payerEmail,
    recipient_phone: source.payerPhone,
    subject: `支付订单 ${order.order_no} 已创建`,
    message_body: `支付订单 ${order.order_no} 已创建，请等待秘书处确认。`,
    template_key: order.business_type.includes("rereview") ? "rereview.payment_required" : "renewal.payment_required",
    payload_json: {
      orderNo: order.order_no,
      businessType: order.business_type,
      applicationNo: source.applicationNo,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    },
    provider: "none",
    provider_response: {},
    created_by: "applicant",
    skipped_at: new Date().toISOString()
  });
}

async function generateOrderNo() {
  const year = new Date().getUTCFullYear();
  for (let attempt = 0; attempt < 10; attempt++) {
    let suffix = "";
    const values = crypto.getRandomValues(new Uint32Array(6));
    values.forEach((value) => {
      suffix += orderNoAlphabet[value % orderNoAlphabet.length];
    });

    const candidate = `ITCA-PAY-${year}-${suffix}`;
    const params = new URLSearchParams({
      select: "order_no",
      order_no: `eq.${candidate}`,
      limit: "1"
    });
    const rows = await supabaseGet<{ order_no: string }>("payment_orders", params);
    if (rows.length === 0) return candidate;
  }

  throw new PaymentRouteError("支付订单编号生成失败，请重试。", 500);
}

function notFoundResponse() {
  return NextResponse.json({ success: false, message: "未查询到匹配的申请记录。请先确认申请编号和联系方式。" }, { status: 404 });
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new PaymentRouteError("支付订单创建服务尚未完成 Supabase 配置。", 503);
  }

  return { url, serviceRoleKey };
}

function getHeaders(prefer?: string) {
  const config = getSupabaseConfig();
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

async function supabaseGet<T>(table: string, params: URLSearchParams) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${table}?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store"
  });
  if (!response.ok) throw new PaymentRouteError(`${table} read failed.`, response.status);
  return (await response.json()) as T[];
}

async function supabasePost<T = unknown>(table: string, row: unknown) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: getHeaders("return=representation"),
    body: JSON.stringify(row)
  });
  if (!response.ok) throw new PaymentRouteError(`${table} write failed.`, response.status);
  return (await response.json()) as T[];
}

const publicOrderSelect = "id,order_no,business_type,application_no,payer_name,amount,currency,payment_channel,provider,status,paid_at,cancelled_at,created_at,updated_at";

type PaymentOrderRow = {
  id: string;
  order_no: string;
  business_type: string;
  application_no: string | null;
  payer_name: string | null;
  amount: number | string;
  currency: string;
  payment_channel: string | null;
  provider: string;
  status: PublicPaymentOrder["status"];
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

function toPublicPaymentOrder(order: PaymentOrderRow): PublicPaymentOrder {
  return {
    orderNo: order.order_no,
    businessType: order.business_type,
    applicationNo: order.application_no || "",
    payerName: order.payer_name || "",
    amount: Number(order.amount || 0),
    currency: order.currency,
    paymentChannel: order.payment_channel || "manual",
    provider: order.provider,
    status: order.status,
    paidAt: order.paid_at,
    cancelledAt: order.cancelled_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}

class PaymentRouteError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}
