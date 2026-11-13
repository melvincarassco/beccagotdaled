import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { createGuestPhotoUpload } from "@/lib/db/photos";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        errors.push(`${file.name}: Unsupported file format. Please upload JPEG, PNG, or WebP.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Exceeds maximum size of 25MB.`);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const caption = captionsMap[file.name] || captionsMap[i.toString()] || null;

        const photo = await createGuestPhotoUpload({
          filename: file.name,
          mimeType: file.type,
          buffer,
          caption,
          uploadedByGuestId: guestId,
          uploaderName,
        });

        uploadedPhotos.push(photo);
      } catch (uploadErr: any) {
        errors.push(`${file.name}: Failed to process upload - ${uploadErr.message}`);
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
      message: `Successfully uploaded ${uploadedPhotos.length} photograph(s). Your photos have been sent to Rebecca & Dale for approval.`,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during photo upload." },
      { status: 500 }
    );
  }
}
