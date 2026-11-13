import { NextRequest, NextResponse } from "next/server";
import { updatePhotoModeration, deletePhoto, updatePhotoCaption } from "@/lib/db/photos";
import { ModerationStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, caption } = body;

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      const updated = await updatePhotoModeration(id, status as ModerationStatus);
      if (!updated) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      if (caption !== undefined) {
        await updatePhotoCaption(id, caption, undefined, true);
      }

      return NextResponse.json({
        success: true,
        photo: updated,
        message: `Photo marked as ${status}.`,
      });
    }

    if (caption !== undefined) {
      const res = await updatePhotoCaption(id, caption, undefined, true);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "No valid action provided" }, { status: 400 });
  } catch (error: any) {
    console.error("Moderation update error:", error);
    return NextResponse.json({ error: "Failed to update photo status" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deletePhoto(id);

    if (!deleted) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Photograph removed." });
  } catch (error: any) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "Failed to delete photograph" }, { status: 500 });
  }
}
