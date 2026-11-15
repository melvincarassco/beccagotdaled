import { NextRequest, NextResponse } from "next/server";
import { toggleGuestStatus, deleteGuest } from "@/lib/db/guests";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json({ error: "isActive state is required." }, { status: 400 });
    }

    const updated = await toggleGuestStatus(id, Boolean(isActive));
    if (!updated) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, guest: updated });
  } catch (error) {
    console.error("Toggle guest error:", error);
    return NextResponse.json({ error: "Failed to update guest status." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteGuest(id);

    if (!success) {
      return NextResponse.json({ error: "Guest not found or could not be removed." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Guest removed successfully." });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json({ error: "Failed to delete guest." }, { status: 500 });
  }
}
