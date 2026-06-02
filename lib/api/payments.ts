import "server-only";

import type { AdminSession } from "@/lib/admin/auth";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

export type PaymentStatus = "pending_payment" | "paid" | "failed" | "cancelled" | "expired" | "manual_review" | "refunded";

export type PaymentOrderListItem = {
  id: string;
  orderNo: string;
  businessType: string;
  businessReference: string;
  payerName: string;
  amount: number;
  currency: string;
  provider: string;
  paymentChannel: string;
  status: PaymentStatus;
  receiptFileName: string;
  receiptUploadedAt: string | null;
  receiptReviewStatus: string;
  receiptReviewedAt: string | null;
  receiptReviewNote: string;
  paidAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type PaymentEvent = {
  id: string;
  paymentOrderId: string;
  orderNo: string;
  eventType: string;
  fromStatus: string;
  toStatus: string;
  provider: string;
  providerEventId: string;
  providerOrderId: string;
  providerTransactionId: string;
  message: string;
  adminNote: string;
  payloadJson: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type PaymentOrderDetail = PaymentOrderListItem & {
  businessId: string | null;
  applicationId: string | null;
  certificationApplicationId: string | null;
  certificateId: string | null;
  applicationNo: string;
  memberNo: string;
  certificateNo: string;
  payerEmail: string;
  payerPhone: string;
  feeCode: string;
  paymentMethod: string;
  providerOrderId: string;
  providerTransactionId: string;
  providerPaymentId: string;
  providerCallbackId: string;
  paymentProofNote: string;
  receiptFilePath: string;
  receiptFileMimeType: string;
  receiptFileSize: number | null;
  receiptReviewedBy: string;
  adminNote: string;
  internalNote: string;
  metadata: Record<string, unknown>;
  providerPayload: Record<string, unknown> | null;
  failedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  refundedAt: string | null;
  manualReviewAt: string | null;
  confirmedAt: string | null;
  confirmedBy: string;
  cancelledBy: string;
  cancelReason: string;
  refundReason: string;
  createdBy: string;
  events: PaymentEvent[];
};

type PaymentOrdersListResponse =
  | {
      success: true;
      orders: PaymentOrderListItem[];
      page?: number;
      pageSize?: number;
    }
  | {
      success: false;
      message: string;
    };

type PaymentOrderDetailResponse =
  | {
      success: true;
      order: PaymentOrderDetail;
    }
  | {
      success: false;
      message: string;
    };

export type PaymentOrderCreateInput = {
  sourceType: "application" | "certification_application";
  sourceId: string;
  businessType?: string;
  amount: number;
  currency: string;
  provider: "none" | "manual";
  paymentChannel: string;
  adminNote?: string;
  actor?: AdminSession;
  ipAddress?: string;
  userAgent?: string;
};

export type RelatedPaymentOrderFilters = {
  applicationId?: string;
  certificationApplicationId?: string;
  applicationNo?: string;
  memberNo?: string;
  certificateNo?: string;
  limit?: number;
};

type PaymentOrderCreateResponse =
  | {
      success: true;
      order: PaymentOrderDetail;
      created: boolean;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export class PaymentApiUnauthorizedError extends Error {
  constructor() {
    super("Payment API request is unauthorized.");
  }
}

export class PaymentApiRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function getItcaApiBaseUrl() {
  return process.env.NEXT_PUBLIC_ITCA_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_ITCA_API_BASE_URL;
}

function getAdminApiHeaders() {
  const token = process.env.ITCA_ADMIN_API_TOKEN || "";

  return {
    "X-ITCA-ADMIN-API-TOKEN": token
  };
}

function getSupabaseRestConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return { url, serviceRoleKey };
}

function getSupabaseHeaders(config: { serviceRoleKey: string }) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

function getAdminActorHeaders(actor?: AdminSession, ipAddress?: string, userAgent?: string) {
  return {
    ...(actor?.actorType ? { "X-ITCA-ADMIN-ACTOR-TYPE": actor.actorType } : {}),
    ...(actor?.adminId ? { "X-ITCA-ADMIN-ACTOR-ID": actor.adminId } : {}),
    ...(actor?.email ? { "X-ITCA-ADMIN-ACTOR-EMAIL": actor.email } : {}),
    ...(actor?.displayName ? { "X-ITCA-ADMIN-ACTOR-NAME": actor.displayName } : {}),
    ...(actor?.role ? { "X-ITCA-ADMIN-ACTOR-ROLE": actor.role } : {}),
    ...(ipAddress ? { "X-ITCA-ADMIN-IP": ipAddress } : {}),
    ...(userAgent ? { "X-ITCA-ADMIN-USER-AGENT": userAgent } : {})
  };
}

function buildPaymentsPath(filters: { status?: string; keyword?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const query = params.toString();

  return query ? `/api/admin/payment-orders?${query}` : "/api/admin/payment-orders";
}

function isValidUuid(value: string) {
  const parts = value.split("-");
  return (
    parts.length === 5 &&
    parts.map((part) => part.length).join("-") === "8-4-4-4-12" &&
    parts.every((part) => /^[0-9a-f]+$/i.test(part))
  );
}

export async function listPaymentOrders(filters: { status?: string; keyword?: string; page?: number; pageSize?: number } = {}) {
  try {
    const response = await fetch(`${getItcaApiBaseUrl()}${buildPaymentsPath(filters)}`, {
      cache: "no-store",
      headers: getAdminApiHeaders()
    });

    if (response.status === 401 || response.status === 403) throw new PaymentApiUnauthorizedError();
    const result = (await response.json().catch(() => null)) as PaymentOrdersListResponse | null;
    if (response.ok && result?.success) {
      return result.orders;
    }
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) throw error;
  }

  return listPaymentOrdersFromSupabase(filters);
}

export async function listRelatedPaymentOrders(filters: RelatedPaymentOrderFilters) {
  const config = getSupabaseRestConfig();
  if (!config) throw new PaymentApiRequestError(500, "支付订单读取服务尚未完成 Supabase 配置。");

  const orFilters = [
    filters.applicationId ? `application_id.eq.${filters.applicationId}` : "",
    filters.certificationApplicationId ? `certification_application_id.eq.${filters.certificationApplicationId}` : "",
    filters.applicationNo ? `application_no.eq.${filters.applicationNo}` : "",
    filters.memberNo ? `member_no.eq.${filters.memberNo}` : "",
    filters.certificateNo ? `certificate_no.eq.${filters.certificateNo}` : ""
  ].filter(Boolean);

  if (orFilters.length === 0) return [];

  const params = new URLSearchParams({
    select: "id,order_no,business_type,application_no,member_no,certificate_no,business_id,payer_name,amount,currency,provider,payment_channel,status,receipt_file_name,receipt_uploaded_at,receipt_review_status,receipt_reviewed_at,receipt_review_note,paid_at,created_at,updated_at",
    or: `(${orFilters.join(",")})`,
    order: "updated_at.desc",
    limit: String(Math.min(Math.max(filters.limit || 5, 1), 20))
  });

  const response = await fetch(`${config.url}/rest/v1/payment_orders?${params.toString()}`, {
    cache: "no-store",
    headers: getSupabaseHeaders(config)
  });
  if (!response.ok) throw new PaymentApiRequestError(response.status, "关联支付记录暂时无法读取。");

  const rows = (await response.json()) as SupabasePaymentOrderRow[];
  return rows.map(toPaymentOrderListItem);
}

export async function getPaymentOrder(id: string) {
  if (!isValidUuid(id)) return null;

  try {
    const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/payment-orders/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: getAdminApiHeaders()
    });

    if (response.status === 401 || response.status === 403) throw new PaymentApiUnauthorizedError();
    if (response.status === 404) return getPaymentOrderFromSupabase(id);

    const result = (await response.json().catch(() => null)) as PaymentOrderDetailResponse | null;
    if (response.ok && result?.success) {
      return result.order;
    }
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) throw error;
  }

  return getPaymentOrderFromSupabase(id);
}

export async function updatePaymentOrderStatus(
  id: string,
  values: { status: "manual_review" | "paid" | "cancelled"; adminNote?: string; actor?: AdminSession; ipAddress?: string; userAgent?: string }
) {
  if (!isValidUuid(id)) return null;

  const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/payment-orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...getAdminApiHeaders(),
      ...getAdminActorHeaders(values.actor, values.ipAddress, values.userAgent)
    },
    body: JSON.stringify({
      status: values.status,
      adminNote: values.adminNote || ""
    })
  });

  if (response.status === 401 || response.status === 403) throw new PaymentApiUnauthorizedError();
  if (response.status === 404) return null;

  const result = (await response.json().catch(() => null)) as PaymentOrderDetailResponse | null;
  if (!response.ok || !result || !result.success) {
    throw new PaymentApiRequestError(response.status, result && !result.success ? result.message : "支付订单状态未能保存。");
  }

  return result.order;
}

export async function createPaymentOrder(values: PaymentOrderCreateInput) {
  if (!isValidUuid(values.sourceId)) {
    throw new PaymentApiRequestError(400, "支付订单来源记录无效。");
  }

  const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/payment-orders`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...getAdminApiHeaders(),
      ...getAdminActorHeaders(values.actor, values.ipAddress, values.userAgent)
    },
    body: JSON.stringify({
      sourceType: values.sourceType,
      sourceId: values.sourceId,
      businessType: values.businessType,
      amount: values.amount,
      currency: values.currency,
      provider: values.provider,
      paymentChannel: values.paymentChannel,
      adminNote: values.adminNote || ""
    })
  });

  if (response.status === 401 || response.status === 403) throw new PaymentApiUnauthorizedError();

  const result = (await response.json().catch(() => null)) as PaymentOrderCreateResponse | null;
  if (!response.ok || !result || !result.success) {
    throw new PaymentApiRequestError(response.status, result && !result.success ? result.message : "支付订单未能生成。");
  }

  return {
    order: result.order,
    created: result.created,
    message: result.message
  };
}

type SupabasePaymentOrderRow = {
  id: string;
  order_no: string;
  business_type: string;
  business_id: string | null;
  application_id: string | null;
  certification_application_id: string | null;
  certificate_id: string | null;
  application_no: string | null;
  member_no: string | null;
  certificate_no: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  amount: number | string;
  currency: string;
  fee_code: string | null;
  payment_channel: string | null;
  payment_method: string | null;
  provider: string;
  provider_order_id: string | null;
  provider_transaction_id: string | null;
  provider_payment_id: string | null;
  provider_callback_id: string | null;
  status: PaymentStatus;
  payment_proof_note: string | null;
  receipt_file_path?: string | null;
  receipt_file_name?: string | null;
  receipt_file_mime_type?: string | null;
  receipt_file_size?: number | string | null;
  receipt_uploaded_at?: string | null;
  receipt_review_status?: string | null;
  receipt_reviewed_at?: string | null;
  receipt_reviewed_by?: string | null;
  receipt_review_note?: string | null;
  admin_note: string | null;
  internal_note: string | null;
  metadata: Record<string, unknown> | null;
  provider_payload: Record<string, unknown> | null;
  paid_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  refunded_at: string | null;
  manual_review_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  refund_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type SupabasePaymentEventRow = {
  id: string;
  payment_order_id: string;
  order_no: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  provider: string;
  provider_event_id: string | null;
  provider_order_id: string | null;
  provider_transaction_id: string | null;
  message: string | null;
  admin_note: string | null;
  payload_json: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
};

async function listPaymentOrdersFromSupabase(filters: { status?: string; keyword?: string; page?: number; pageSize?: number }) {
  const config = getSupabaseRestConfig();
  if (!config) throw new PaymentApiRequestError(500, "支付订单读取服务尚未完成 Supabase 配置。");

  const params = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
    limit: String(filters.pageSize || 100),
    offset: String(((filters.page || 1) - 1) * (filters.pageSize || 100))
  });
  if (filters.status) params.set("status", `eq.${filters.status}`);

  const response = await fetch(`${config.url}/rest/v1/payment_orders?${params.toString()}`, {
    cache: "no-store",
    headers: getSupabaseHeaders(config)
  });
  if (!response.ok) throw new PaymentApiRequestError(response.status, "支付订单暂时无法读取。");

  let rows = (await response.json()) as SupabasePaymentOrderRow[];
  const keyword = filters.keyword?.trim().toLowerCase();
  if (keyword) {
    rows = rows.filter((row) =>
      [row.order_no, row.application_no, row.member_no, row.certificate_no, row.payer_name, row.payer_email, row.payer_phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }

  return rows.map(toPaymentOrderListItem);
}

async function getPaymentOrderFromSupabase(id: string) {
  const config = getSupabaseRestConfig();
  if (!config) throw new PaymentApiRequestError(500, "支付订单详情服务尚未完成 Supabase 配置。");

  const orderParams = new URLSearchParams({
    id: `eq.${id}`,
    select: "*",
    limit: "1"
  });
  const orderResponse = await fetch(`${config.url}/rest/v1/payment_orders?${orderParams.toString()}`, {
    cache: "no-store",
    headers: getSupabaseHeaders(config)
  });
  if (!orderResponse.ok) throw new PaymentApiRequestError(orderResponse.status, "支付订单详情暂时无法读取。");

  const orders = (await orderResponse.json()) as SupabasePaymentOrderRow[];
  const order = orders[0];
  if (!order) return null;

  const eventParams = new URLSearchParams({
    payment_order_id: `eq.${id}`,
    select: "*",
    order: "created_at.desc"
  });
  const eventsResponse = await fetch(`${config.url}/rest/v1/payment_events?${eventParams.toString()}`, {
    cache: "no-store",
    headers: getSupabaseHeaders(config)
  });
  const events = eventsResponse.ok ? ((await eventsResponse.json()) as SupabasePaymentEventRow[]) : [];

  return toPaymentOrderDetail(order, events.map(toPaymentEvent));
}

function toPaymentOrderListItem(row: SupabasePaymentOrderRow): PaymentOrderListItem {
  return {
    id: row.id,
    orderNo: row.order_no,
    businessType: row.business_type,
    businessReference: row.application_no || row.member_no || row.certificate_no || row.business_id || "",
    payerName: row.payer_name || "",
    amount: Number(row.amount || 0),
    currency: row.currency,
    provider: row.provider,
    paymentChannel: row.payment_channel || "manual",
    status: row.status,
    receiptFileName: row.receipt_file_name || "",
    receiptUploadedAt: row.receipt_uploaded_at || null,
    receiptReviewStatus: row.receipt_review_status || (row.receipt_file_name ? "pending_review" : "not_uploaded"),
    receiptReviewedAt: row.receipt_reviewed_at || null,
    receiptReviewNote: row.receipt_review_note || "",
    paidAt: row.paid_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

function toPaymentOrderDetail(row: SupabasePaymentOrderRow, events: PaymentEvent[]): PaymentOrderDetail {
  return {
    ...toPaymentOrderListItem(row),
    businessId: row.business_id,
    applicationId: row.application_id,
    certificationApplicationId: row.certification_application_id,
    certificateId: row.certificate_id,
    applicationNo: row.application_no || "",
    memberNo: row.member_no || "",
    certificateNo: row.certificate_no || "",
    payerEmail: row.payer_email || "",
    payerPhone: row.payer_phone || "",
    feeCode: row.fee_code || "",
    paymentMethod: row.payment_method || "",
    providerOrderId: row.provider_order_id || "",
    providerTransactionId: row.provider_transaction_id || "",
    providerPaymentId: row.provider_payment_id || "",
    providerCallbackId: row.provider_callback_id || "",
    paymentProofNote: row.payment_proof_note || "",
    receiptFilePath: row.receipt_file_path || "",
    receiptFileMimeType: row.receipt_file_mime_type || "",
    receiptFileSize: row.receipt_file_size === null || row.receipt_file_size === undefined ? null : Number(row.receipt_file_size),
    receiptReviewedBy: row.receipt_reviewed_by || "",
    adminNote: row.admin_note || "",
    internalNote: row.internal_note || "",
    metadata: redactObject(row.metadata || {}),
    providerPayload: row.provider_payload ? redactObject(row.provider_payload) : null,
    failedAt: row.failed_at,
    cancelledAt: row.cancelled_at,
    expiredAt: row.expired_at,
    refundedAt: row.refunded_at,
    manualReviewAt: row.manual_review_at,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by || "",
    cancelledBy: row.cancelled_by || "",
    cancelReason: row.cancel_reason || "",
    refundReason: row.refund_reason || "",
    createdBy: row.created_by || "system",
    events
  };
}

function toPaymentEvent(row: SupabasePaymentEventRow): PaymentEvent {
  return {
    id: row.id,
    paymentOrderId: row.payment_order_id,
    orderNo: row.order_no,
    eventType: row.event_type,
    fromStatus: row.from_status || "",
    toStatus: row.to_status || "",
    provider: row.provider,
    providerEventId: row.provider_event_id || "",
    providerOrderId: row.provider_order_id || "",
    providerTransactionId: row.provider_transaction_id || "",
    message: row.message || "",
    adminNote: row.admin_note || "",
    payloadJson: redactObject(row.payload_json || {}),
    createdBy: row.created_by || "system",
    createdAt: row.created_at
  };
}

function redactObject(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value, (key, nestedValue) => (isSensitiveKey(key) ? "[redacted]" : nestedValue))) as Record<string, unknown>;
}

function isSensitiveKey(key: string) {
  return /token|secret|key|password|connection|storage_path|storagePath|provider_secret|payment_secret|vt/i.test(key);
}
