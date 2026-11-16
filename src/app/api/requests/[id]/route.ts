import { NextRequest, NextResponse } from "next/server";
import { updateAccessRequestStatus } from "@/lib/db/requests";
import { createGuest } from "@/lib/db/guests";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, addToGuestList } = body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await updateAccessRequestStatus(id, status);
    if (!targetRequestExists(updated)) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    let addedGuest = null;
    if (status === "approved" && addToGuestList && updated) {
      // Auto-create in guests table so they can immediately sign in!
      try {
        addedGuest = await createGuest(updated.firstName, updated.lastName, null, true);
      } catch (guestErr) {
        console.error("Auto create guest error:", guestErr);
      }
    }

    return NextResponse.json({
      success: true,
      request: updated,
      addedGuest,
      message:
        status === "approved"
          ? `Approved access for ${updated?.firstName} ${updated?.lastName}${addedGuest ? " and added to guest register!" : ""}`
          : `Request marked as ${status}`,
    });
  } catch (error: any) {
    console.error("Update access request error:", error);
    return NextResponse.json(
      { error: "Failed to update access request" },
      { status: 500 }
    );
  }
}

function targetRequestExists(req: any): boolean {
  return !!req;
}
