import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
