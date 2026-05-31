import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createPaymentOrder, PaymentApiRequestError, PaymentApiUnauthorizedError } from "@/lib/api/payments";

const validSourceTypes = ["application", "certification_application"] as const;
const validProviders = ["none", "manual"] as const;

function getAdminCookie(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${adminSessionCookieName}=`))
    ?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

export async function POST(request: Request) {
  const adminCookie = getAdminCookie(request);
  if (!isValidAdminSessionToken(adminCookie)) return unauthorized();

  let body: {
    sourceType?: string;
    sourceId?: string;
    businessType?: string;
    amount?: number | string;
    currency?: string;
    provider?: string;
    paymentChannel?: string;
    adminNote?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, message: "支付订单创建资料格式不正确。" }, { status: 400 });
  }

  if (!body.sourceType || !validSourceTypes.includes(body.sourceType as (typeof validSourceTypes)[number])) {
    return NextResponse.json({ success: false, message: "请选择有效的支付订单来源。" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, message: "请输入大于 0 的金额。" }, { status: 400 });
  }

  const provider = body.provider || "manual";
  if (!validProviders.includes(provider as (typeof validProviders)[number])) {
    return NextResponse.json({ success: false, message: "请选择有效的支付方式。" }, { status: 400 });
  }

  try {
    const result = await createPaymentOrder({
      sourceType: body.sourceType as (typeof validSourceTypes)[number],
      sourceId: body.sourceId || "",
      businessType: body.businessType?.trim() || undefined,
      amount,
      currency: (body.currency || "MYR").trim().toUpperCase(),
      provider: provider as (typeof validProviders)[number],
      paymentChannel: (body.paymentChannel || provider).trim(),
      adminNote: body.adminNote?.trim() || "",
      actor: getAdminSession(adminCookie) || undefined,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) return unauthorized();
    if (error instanceof PaymentApiRequestError) return NextResponse.json({ success: false, message: error.message }, { status: error.status >= 400 && error.status < 500 ? error.status : 500 });
    return NextResponse.json({ success: false, message: "支付订单创建服务暂时不可用。" }, { status: 500 });
  }
}
