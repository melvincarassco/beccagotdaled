import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentGuestSession();
    const body = await request.json();

    const { key, filename, mimeType, caption, displayUrl, width, height } = body;

    if (!key || !filename) {
      return NextResponse.json({ error: "Storage key and filename are required" }, { status: 400 });
    }

    const guestId = session?.id || body.guestId || null;
    const uploaderName = session?.fullName || body.uploaderName || "Wedding Guest";

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestId || "");
    const guestUuid = isUuid ? guestId : null;

    const sanitizedCaption = caption ? String(caption).trim().slice(0, 280) : null;
    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { data: dbPhoto, error: insertError } = await adminClient
      .from("photos")
      .insert({
        filename,
        mime_type: mimeType || "image/jpeg",
        caption: sanitizedCaption,
        uploaded_by: guestUuid,
        upload_source: "guest_upload",
        moderation_status: "approved",
        watermark_applied: false,
        drive_file_id: null,
        original_storage_path: `r2://${key}`,
        watermarked_storage_path: uploaderName,
        thumbnail_url: displayUrl || `/api/photos/r2/${key}`,
        display_url: displayUrl || `/api/photos/r2/${key}`,
        width: typeof width === "number" ? width : 1920,
        height: typeof height === "number" ? height : 1080,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error on complete upload:", insertError);
      return NextResponse.json({ error: "Failed to save photo record to gallery database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      photo: dbPhoto,
      message: "Photo uploaded and confirmed in gallery!",
    });
  } catch (error: any) {
    console.error("Complete upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to finalize photo upload" }, { status: 500 });
  }
}
