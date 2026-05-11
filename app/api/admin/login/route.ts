import { NextResponse } from "next/server";
import { AdminConfigError, adminSessionCookieName, createAdminSessionToken, verifyAdminPassword } from "@/lib/admin/auth";

export async function POST(request: Request) {
  let password = "";

  try {
    const body = (await request.json()) as { password?: string };
    password = body.password || "";
  } catch {
    return NextResponse.json({ success: false, message: "登录资料格式不正确。" }, { status: 400 });
  }

  try {
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ success: false, message: "后台密码不正确。" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(adminSessionCookieName, createAdminSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    if (error instanceof AdminConfigError) {
      return NextResponse.json({ success: false, message: "后台密码尚未配置，请先设置 ADMIN_PASSWORD。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "后台登录服务暂时不可用。" }, { status: 500 });
  }
}
