import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getPaymentOrder, updatePaymentOrderStatus } from "@/lib/api/payments";
import { createPaymentReceiptSignedUrl, reviewPaymentReceipt } from "@/lib/payment-receipts";

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();
  const order = await getPaymentOrder(params.id);
  if (!order || !order.receiptFilePath) return NextResponse.json({ success: false, message: "付款凭证不存在。" }, { status: 404 });
  try {
    return NextResponse.json({ success: true, url: await createPaymentReceiptSignedUrl(order.receiptFilePath) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "付款凭证查看链接暂时无法生成。" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const adminCookie = getAdminCookie(request);
  if (!isValidAdminSessionToken(adminCookie)) return unauthorized();
  const actor = getAdminSession(adminCookie);
  const body = (await request.json().catch(() => null)) as { action?: string; note?: string } | null;
  if (!body || !["approve", "reject"].includes(body.action || "")) {
    return NextResponse.json({ success: false, message: "请选择有效的财务审核操作。" }, { status: 400 });
  }

  const order = await getPaymentOrder(params.id);
  if (!order) return NextResponse.json({ success: false, message: "未找到支付订单。" }, { status: 404 });
  if (!order.receiptFileName) return NextResponse.json({ success: false, message: "该订单尚未上传付款凭证。" }, { status: 400 });

  try {
    await reviewPaymentReceipt({
      orderId: order.id,
      orderNo: order.orderNo,
      applicationNo: order.applicationNo,
      nextStatus: body.action === "approve" ? "approved" : "rejected",
      note: body.note?.trim() || "",
      actor,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });
    if (body.action === "approve" && order.status !== "paid") {
      await updatePaymentOrderStatus(order.id, {
        status: "paid",
        adminNote: body.note?.trim() || "付款凭证审核通过，财务确认已收款。",
        actor: actor || undefined,
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get("user-agent") || ""
      });
    }
    return NextResponse.json({ success: true, message: body.action === "approve" ? "付款凭证已通过，订单已确认收款。" : "付款凭证已标记不通过，申请人可重新上传。" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "付款凭证审核暂时不可用。" }, { status: 500 });
  }
}
