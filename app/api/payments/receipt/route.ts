import { NextResponse } from "next/server";
import { findApplicationByNoAndContact, findCertificationByNoAndContact, findPublicPaymentOrderByOrderNo } from "@/lib/supabase/server";
import { uploadPaymentReceipt } from "@/lib/payment-receipts";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: "付款凭证资料格式不正确。" }, { status: 400 });
  }

  const orderNo = asString(formData.get("orderNo")).toUpperCase();
  const applicationNo = asString(formData.get("applicationNo"));
  const contact = asString(formData.get("contact"));
  const file = formData.get("receipt");
  if (!orderNo || !applicationNo || !contact || !(file instanceof File)) {
    return NextResponse.json({ success: false, message: "请填写申请编号、联系方式并上传付款凭证。" }, { status: 400 });
  }

  const normalizedApplicationNo = applicationNo.toUpperCase();
  const application = normalizedApplicationNo.includes("TAO")
    ? await findCertificationByNoAndContact(applicationNo, contact)
    : await findApplicationByNoAndContact(applicationNo, contact);
  if (!application) {
    return NextResponse.json({ success: false, message: "申请编号或联系方式不匹配，不能上传付款凭证。" }, { status: 403 });
  }

  const order = await findPublicPaymentOrderByOrderNo(orderNo);
  if (!order || order.applicationNo !== application.applicationNo) {
    return NextResponse.json({ success: false, message: "未找到可上传凭证的支付订单。" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ success: false, message: "该订单已确认付款，无需重复上传。" }, { status: 409 });
  }

  try {
    const result = await uploadPaymentReceipt({
      orderId: await getPaymentOrderId(orderNo),
      orderNo,
      applicationNo: application.applicationNo,
      file
    });
    return NextResponse.json({ success: true, receipt: result });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "付款凭证上传失败。" }, { status: 500 });
  }
}

async function getPaymentOrderId(orderNo: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("付款凭证服务尚未配置。");
  const params = new URLSearchParams({ order_no: `eq.${orderNo}`, select: "id", limit: "1" });
  const response = await fetch(`${url}/rest/v1/payment_orders?${params.toString()}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    },
    cache: "no-store"
  });
  const rows = response.ok ? ((await response.json()) as Array<{ id?: string }>) : [];
  const id = rows[0]?.id;
  if (!id) throw new Error("未找到支付订单。");
  return id;
}
