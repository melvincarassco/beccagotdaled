import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { isR2Configured } from "@/lib/r2/client";
import { createR2PresignedUploadUrl } from "@/lib/r2/upload";

export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ success: false, fallback: true, reason: "r2_not_configured" });
    }

    const body = await request.json().catch(() => ({}));
    const { filename, mimeType, fileSize } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const session = await getCurrentGuestSession();
    const guestId = session?.id || body.guestId || "guest-anon";

    const presigned = await createR2PresignedUploadUrl({
      filename,
      mimeType: mimeType || "image/jpeg",
      fileSize: typeof fileSize === "number" ? fileSize : undefined,
      prefix: "guest-uploads",
    });

    if (!presigned) {
      return NextResponse.json({ success: false, fallback: true, reason: "presign_failed" });
    }

    return NextResponse.json({
      success: true,
      uploadUrl: presigned.uploadUrl,
      key: presigned.key,
      displayUrl: presigned.displayUrl,
      guestId,
    });
  } catch (error: any) {
    console.error("Presign upload error:", error);
    return NextResponse.json({ success: false, fallback: true, error: error.message }, { status: 500 });
  }
}
