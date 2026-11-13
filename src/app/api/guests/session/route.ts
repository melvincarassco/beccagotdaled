import { NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";

export async function GET() {
  try {
    const session = await getCurrentGuestSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, guest: null });
    }
    return NextResponse.json({ authenticated: true, guest: session });
  } catch {
    return NextResponse.json({ authenticated: false, guest: null });
  }
}
