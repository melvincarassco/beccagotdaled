import { NextRequest, NextResponse } from "next/server";
import { getPhotoById } from "@/lib/db/photos";
import { getGoogleDriveClient } from "@/lib/drive/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { recordDownloadEvent } from "@/lib/db/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photo = await getPhotoById(id);

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Record download event with guest session
    try {
      const session = await getCurrentGuestSession();
      const guestId = session?.id || "guest";
      const guestName = session?.fullName || "Guest";

      await recordDownloadEvent({
        guestId,
        guestName,
        photoId: photo.id,
        photoFilename: photo.filename,
        photoCaption: photo.caption,
        photoThumbnail: photo.thumbnail_url || photo.display_url,
      });
    } catch (analyticsErr) {
      console.error("Failed to record download event:", analyticsErr);
    }

    let imageBuffer: Buffer;

    // If photo has a Google Drive File ID and Drive client is configured, stream from Drive
    const drive = getGoogleDriveClient();
    const targetUrl =
      photo.original_storage_path && photo.original_storage_path.startsWith("http")
        ? photo.original_storage_path
        : photo.display_url && photo.display_url.startsWith("http")
        ? photo.display_url
        : null;

    if (photo.drive_file_id && drive) {
      try {
        const driveRes = await drive.files.get(
          { fileId: photo.drive_file_id, alt: "media", supportsAllDrives: true },
          { responseType: "arraybuffer" }
        );
        imageBuffer = Buffer.from(driveRes.data as ArrayBuffer);
      } catch {
        if (targetUrl) {
          const resp = await fetch(targetUrl);
          imageBuffer = Buffer.from(await resp.arrayBuffer());
        } else {
          throw new Error("Could not download Drive file");
        }
      }
    } else if (targetUrl) {
      const resp = await fetch(targetUrl);
      imageBuffer = Buffer.from(await resp.arrayBuffer());
    } else {
      // Download directly from Supabase storage bucket
      const adminClient = createAdminClient();
      let storagePath = "";
      if (photo.original_storage_path?.includes("guest-uploads/")) {
        storagePath = `guest-uploads/${photo.original_storage_path.split("guest-uploads/")[1]}`;
      } else if (photo.display_url?.includes("guest-uploads/")) {
        storagePath = `guest-uploads/${photo.display_url.split("guest-uploads/")[1]}`;
      }

      if (adminClient && storagePath) {
        const { data: fileBlob, error: dlErr } = await adminClient.storage
          .from("photos")
          .download(storagePath);
        if (!dlErr && fileBlob) {
          imageBuffer = Buffer.from(await fileBlob.arrayBuffer());
        } else {
          throw new Error("Could not load image file from storage");
        }
      } else {
        throw new Error("No download source available for photograph");
      }
    }

    const safeFilename = `Rebecca_Dale_${photo.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": photo.mime_type || "image/jpeg",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("Photo download error:", error);
    return NextResponse.json(
      { error: "Failed to download photograph." },
      { status: 500 }
    );
  }
}
