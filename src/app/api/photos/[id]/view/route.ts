import { NextRequest, NextResponse } from "next/server";
import { getPhotoById } from "@/lib/db/photos";
import { getGoogleDriveClient } from "@/lib/drive/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getR2ObjectBuffer } from "@/lib/r2/upload";

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

    // 0. If photo is stored in Cloudflare R2
    if (photo.original_storage_path?.startsWith("r2://") || photo.display_url?.includes("/api/photos/r2/")) {
      const r2Key = photo.original_storage_path?.startsWith("r2://")
        ? photo.original_storage_path.slice(5)
        : photo.display_url?.split("/api/photos/r2/")[1]?.split("?")[0];

      if (r2Key) {
        const obj = await getR2ObjectBuffer(decodeURIComponent(r2Key));
        if (obj?.buffer) {
          let buffer = obj.buffer;
          let outMime = obj.mimeType || mimeType;

          const isHeic =
            outMime.includes("heic") ||
            outMime.includes("heif") ||
            /\.hei[cf]$/i.test(r2Key);

          if (isHeic) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const convert = require("heic-convert");
              const converted = await convert({ buffer, format: "JPEG", quality: 0.95 });
              buffer = Buffer.from(converted);
              outMime = "image/jpeg";
            } catch {}
          }

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": outMime,
              "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
              "CDN-Cache-Control": "public, max-age=31536000",
            },
          });
        }
      }
    }

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
      // Determine candidate storage paths in Supabase Storage bucket 'photos'
      const candidatePaths: string[] = [];
      const addPath = (p: string | null | undefined) => {
        if (!p) return;
        const clean = p.replace(/^\/+/, "");
        if (clean.includes("guest-uploads/")) {
          candidatePaths.push(clean.slice(clean.indexOf("guest-uploads/")));
        } else {
          candidatePaths.push(`guest-uploads/${clean}`);
          candidatePaths.push(clean);
          if (clean.startsWith("uploads/")) {
            candidatePaths.push(`guest-uploads/${clean.replace(/^uploads\//, "")}`);
            candidatePaths.push(clean.replace(/^uploads\//, ""));
          }
        }
      };

      addPath(photo.original_storage_path);
      if (photo.display_url && !photo.display_url.startsWith("http")) {
        addPath(photo.display_url);
      }

      for (const storagePath of [...new Set(candidatePaths)]) {
        try {
          const { data: fileBlob, error: downloadError } = await adminClient.storage
            .from("photos")
            .download(storagePath);

          if (!downloadError && fileBlob) {
            let buffer = Buffer.from(await fileBlob.arrayBuffer());
            let outMime = fileBlob.type || mimeType;

            const isHeic =
              outMime.includes("heic") ||
              outMime.includes("heif") ||
              /\.hei[cf]$/i.test(storagePath);

            if (isHeic) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const convert = require("heic-convert");
                const converted = await convert({ buffer, format: "JPEG", quality: 0.95 });
                buffer = Buffer.from(converted);
                outMime = "image/jpeg";
              } catch {}
            }

            return new NextResponse(new Uint8Array(buffer), {
              status: 200,
              headers: {
                "Content-Type": outMime,
                "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
                "CDN-Cache-Control": "public, max-age=31536000",
              },
            });
          }
        } catch (storageErr) {
          console.warn(`Supabase storage download error at ${storagePath}:`, storageErr);
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
