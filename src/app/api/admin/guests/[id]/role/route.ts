import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-session";
import { toggleGuestAdmin } from "@/lib/db/guests";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await toggleGuestAdmin(id);

    return NextResponse.json({
      success: true,
      isAdmin: result.isAdmin,
      message: result.isAdmin
        ? "Guest granted administrator access."
        : "Guest administrator access revoked.",
    });
  } catch (error: any) {
    console.error("Toggle guest admin error:", error);
    return NextResponse.json(
      { error: "Failed to update guest administrator status." },
      { status: 500 }
    );
  }
}
