import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie, DEFAULT_ADMIN_PASSWORD } from "@/lib/auth/admin-session";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit login attempts (5 attempts per minute)
    const ip = request.headers.get("x-forwarded-for") || "admin-client";
    const limit = checkRateLimit(`admin-login-${ip}`, 5, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${limit.resetInSec} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!password || password.trim() !== expectedPassword.trim()) {
      return NextResponse.json(
        { error: "Invalid administrator credentials. Please check your password." },
        { status: 401 }
      );
    }

    const adminEmail = email?.trim() || "admin@beccagotdaled.com";
    await setAdminSessionCookie(adminEmail);

    return NextResponse.json({
      success: true,
      message: "Administrator session established.",
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Failed to authenticate administrator." }, { status: 500 });
  }
}
