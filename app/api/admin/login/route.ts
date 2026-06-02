import { NextResponse } from "next/server";
import { AdminConfigError, adminSessionCookieName, createAdminSessionToken, createAdminUserSessionToken, verifyAdminPassword } from "@/lib/admin/auth";
import { findActiveAdminUserByEmail, touchAdminLastLogin, verifyPasswordHash } from "@/lib/admin/users";

export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim().toLowerCase() || "";
    password = body.password || "";
  } catch {
    return NextResponse.json({ success: false, message: "登录资料格式不正确。" }, { status: 400 });
  }

  try {
    let sessionToken = "";

    if (email) {
      const admin = await findActiveAdminUserByEmail(email);
      if (admin?.passwordHash && verifyPasswordHash(password, admin.passwordHash)) {
        sessionToken = createAdminUserSessionToken({
          id: admin.id,
          email: admin.email,
          displayName: admin.displayName,
          role: admin.role
        });
        await touchAdminLastLogin(admin.id);
      }
    }

    if (!sessionToken) {
      if (!verifyAdminPassword(password)) {
        return NextResponse.json({ success: false, message: "后台登录资料不正确。" }, { status: 401 });
      }
      sessionToken = createAdminSessionToken();
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(adminSessionCookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    if (error instanceof AdminConfigError) {
      return NextResponse.json({ success: false, message: "后台密码尚未配置，请先完成服务端后台密码环境配置。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "后台登录服务暂时不可用。" }, { status: 500 });
  }
}
