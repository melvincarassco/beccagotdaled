import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { updatePhotoCaption } from "@/lib/db/photos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { caption, isAdmin } = body;

    const guestSession = await getCurrentGuestSession();
    const editorGuestId = guestSession?.id;

    const result = await updatePhotoCaption(
      id,
      caption || "",
      editorGuestId,
      Boolean(isAdmin)
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update caption" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      photo: result.photo,
      message: "Caption updated successfully.",
    });
  } catch (error: any) {
    console.error("Caption update error:", error);
    return NextResponse.json({ error: "Failed to update caption." }, { status: 500 });
  }
}
