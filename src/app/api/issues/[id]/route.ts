import { NextRequest, NextResponse } from "next/server";
import { updateIssueStatus } from "@/lib/db/issues";
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
    const { status, adminNotes } = body;

    if (!["open", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await updateIssueStatus(id, status, adminNotes);
    if (!updated) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      issue: updated,
      message: `Issue marked as ${status.toUpperCase()}`,
    });
  } catch (error: any) {
    console.error("Update issue status error:", error);
    return NextResponse.json(
      { error: "Failed to update issue status" },
      { status: 500 }
    );
  }
}
