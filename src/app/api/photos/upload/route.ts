import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { createGuestPhotoUpload } from "@/lib/db/photos";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/pjpeg",
  "image/x-png",
  "application/octet-stream",
];
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export async function POST(request: NextRequest) {
  try {
    // 1. Check guest authentication session
    const guestSession = await getCurrentGuestSession();
    const formData = await request.formData();

    // Fallback: check if guestId and uploaderName were passed in formData
    const guestId = guestSession?.id || (formData.get("guestId") as string) || "guest-anon";
    const uploaderName = guestSession?.fullName || (formData.get("uploaderName") as string) || "Wedding Guest";

    const files = formData.getAll("files") as File[];
    const captionsRaw = (formData.get("captions") as string) || "{}";
    let captionsMap: Record<string, string> = {};

    try {
      captionsMap = JSON.parse(captionsRaw);
    } catch {}

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one photograph to upload." },
        { status: 400 }
      );
    }

    const uploadedPhotos = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Normalize MIME type
      let detectedMime = file.type?.toLowerCase() || "";
      if (!detectedMime || detectedMime === "application/octet-stream") {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "png") detectedMime = "image/png";
        else if (ext === "webp") detectedMime = "image/webp";
        else if (ext === "heic" || ext === "heif") detectedMime = "image/heic";
        else detectedMime = "image/jpeg";
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(detectedMime) && !detectedMime.startsWith("image/")) {
        errors.push(`${file.name}: Unsupported file format. Please upload JPEG, PNG, WebP, or HEIC.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Exceeds maximum size of 30MB.`);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const caption = captionsMap[file.name] || captionsMap[i.toString()] || null;

        const photo = await createGuestPhotoUpload({
          filename: file.name,
          mimeType: detectedMime,
          buffer,
          caption,
          uploadedByGuestId: guestId,
          uploaderName,
        });

        uploadedPhotos.push(photo);
      } catch (uploadErr: any) {
        const errorMsg = uploadErr?.message || "Unknown error";
        errors.push(`${file.name}: Failed to process upload - ${errorMsg}`);

        // Automatically log issue to bug tracker
        try {
          const { createIssueReport } = await import("@/lib/db/issues");
          await createIssueReport({
            guestName: uploaderName,
            guestContact: `Guest ID: ${guestId}`,
            pageUrl: "/api/photos/upload",
            componentOrArea: "Photo Upload & Speed",
            title: `Server upload failed: ${file.name}`,
            description: `Server-side upload processing failed for "${file.name}": ${errorMsg}`,
            codeSemantics: `MIME: ${detectedMime}\nSize: ${file.size} bytes\nStack: ${uploadErr?.stack || "none"}`,
            deviceInfo: request.headers.get("user-agent") || undefined,
          });
        } catch (trackerErr) {
          console.warn("Failed to auto-track upload issue:", trackerErr);
        }
      }
    }

    if (uploadedPhotos.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      photos: uploadedPhotos,
      count: uploadedPhotos.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedPhotos.length} photograph(s). They are now live in the wedding gallery!`,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during photo upload." },
      { status: 500 }
    );
  }
}
