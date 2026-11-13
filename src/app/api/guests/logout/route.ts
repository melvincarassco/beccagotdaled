import { NextResponse } from "next/server";
import { clearGuestSessionCookie } from "@/lib/auth/guest-session";

export async function POST() {
  await clearGuestSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
