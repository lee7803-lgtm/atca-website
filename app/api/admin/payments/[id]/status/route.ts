import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/auth";
import { requireAdminApiPermission } from "@/lib/admin/require-admin";
import { PaymentApiRequestError, PaymentApiUnauthorizedError, updatePaymentOrderStatus } from "@/lib/api/payments";

const validStatuses = ["manual_review", "paid", "cancelled"] as const;

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminApiPermission(request, "payments:write");
  if (auth.response) return auth.response;
  const adminCookie = getAdminCookie(request);

  let body: { status?: string; adminNote?: string };

  try {
    body = (await request.json()) as { status?: string; adminNote?: string };
  } catch {
    return NextResponse.json({ success: false, message: "支付订单更新资料格式不正确。" }, { status: 400 });
  }

  if (!body.status || !validStatuses.includes(body.status as (typeof validStatuses)[number])) {
    return NextResponse.json({ success: false, message: "请选择有效的支付订单操作。" }, { status: 400 });
  }

  try {
    const order = await updatePaymentOrderStatus(params.id, {
      status: body.status as (typeof validStatuses)[number],
      adminNote: body.adminNote?.trim() || "",
      actor: getAdminSession(adminCookie) || undefined,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "未找到支付订单。" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    if (error instanceof PaymentApiUnauthorizedError) return unauthorized();
    if (error instanceof PaymentApiRequestError) return NextResponse.json({ success: false, message: error.message }, { status: error.status >= 400 && error.status < 500 ? error.status : 500 });
    return NextResponse.json({ success: false, message: "支付订单状态保存服务暂时不可用。" }, { status: 500 });
  }
}
