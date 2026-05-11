import { NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/admin/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(adminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}
