import { NextRequest, NextResponse } from "next/server";
import { getPhotoById } from "@/lib/db/photos";
import { getGoogleDriveClient } from "@/lib/drive/client";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const mimeType = photo.mime_type || "image/jpeg";

    // 1. If photo is from Google Drive, stream via Drive client or Google CDN thumbnail
    if (photo.drive_file_id) {
      const drive = getGoogleDriveClient();
      if (drive) {
        try {
          const meta = await drive.files.get({
            fileId: photo.drive_file_id,
            fields: "id, mimeType, thumbnailLink",
            supportsAllDrives: true,
          });

          if (meta.data.thumbnailLink) {
            const highResThumbUrl = meta.data.thumbnailLink.replace(/=s\d+/, "=s2048");
            const thumbRes = await fetch(highResThumbUrl);
            if (thumbRes.ok) {
              const thumbBuffer = await thumbRes.arrayBuffer();
              return new NextResponse(new Uint8Array(thumbBuffer), {
                status: 200,
                headers: {
                  "Content-Type": meta.data.mimeType || "image/jpeg",
                  "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
                },
              });
            }
          }

          // Fallback to raw media stream
          const driveRes = await drive.files.get(
            { fileId: photo.drive_file_id, alt: "media", supportsAllDrives: true },
            { responseType: "arraybuffer" }
          );
          return new NextResponse(new Uint8Array(driveRes.data as ArrayBuffer), {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        } catch (driveErr) {
          console.warn("Drive stream error in photo view route:", driveErr);
        }
      }
    }

    // 2. If photo is a Guest Upload stored in Supabase Storage
    const adminClient = createAdminClient();
    if (adminClient) {
      // Determine storage path (e.g. guest-uploads/...)
      let storagePath = "";
      if (photo.original_storage_path && photo.original_storage_path.includes("guest-uploads/")) {
        const parts = photo.original_storage_path.split("guest-uploads/");
        storagePath = `guest-uploads/${parts[1]}`;
      } else if (photo.display_url && photo.display_url.includes("guest-uploads/")) {
        const parts = photo.display_url.split("guest-uploads/");
        storagePath = `guest-uploads/${parts[1]}`;
      }

      if (storagePath) {
        try {
          const { data: fileBlob, error: downloadError } = await adminClient.storage
            .from("photos")
            .download(storagePath);

          if (!downloadError && fileBlob) {
            const arrayBuffer = await fileBlob.arrayBuffer();
            return new NextResponse(new Uint8Array(arrayBuffer), {
              status: 200,
              headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
              },
            });
          }
        } catch (storageErr) {
          console.warn("Supabase storage download error in view route:", storageErr);
        }
      }
    }

    // 3. Fallback: fetch original display_url server-side
    if (photo.display_url && photo.display_url.startsWith("http")) {
      try {
        const fetchRes = await fetch(photo.display_url);
        if (fetchRes.ok) {
          const buffer = await fetchRes.arrayBuffer();
          const contentType = fetchRes.headers.get("content-type") || mimeType;
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        }
      } catch (fetchErr) {
        console.warn("Fallback fetch failed in photo view route:", fetchErr);
      }
    }

    return NextResponse.json({ error: "Failed to load photo." }, { status: 404 });
  } catch (error: any) {
    console.error("Photo view route error:", error);
    return NextResponse.json(
      { error: "Internal server error streaming photo." },
      { status: 500 }
    );
  }
}
