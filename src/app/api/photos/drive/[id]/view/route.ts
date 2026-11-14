import { NextRequest, NextResponse } from "next/server";
import { getGoogleDriveClient } from "@/lib/drive/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const drive = getGoogleDriveClient();

    if (!drive) {
      return NextResponse.json(
        { error: "Google Drive service account is not configured." },
        { status: 500 }
      );
    }

    // 1. Fetch file metadata including thumbnailLink
    let mimeType = "image/jpeg";
    let thumbnailLink: string | null = null;

    try {
      const meta = await drive.files.get({
        fileId: id,
        fields: "id, name, mimeType, thumbnailLink",
        supportsAllDrives: true,
      });

      if (meta.data.mimeType) {
        mimeType = meta.data.mimeType;
      }
      if (meta.data.thumbnailLink) {
        thumbnailLink = meta.data.thumbnailLink;
      }
    } catch (metaErr) {
      console.warn("Could not fetch Drive metadata for file:", id, metaErr);
    }

    // 2. High-res rendering: For Apple HEIC files or photos with thumbnailLink,
    // Google Drive's CDN renders high-resolution JPEG via thumbnailLink with =s2048.
    // This solves HEIC browser incompatibility and bypasses CORS.
    if (thumbnailLink) {
      try {
        const highResThumbUrl = thumbnailLink.replace(/=s\d+/, "=s2048");
        const thumbRes = await fetch(highResThumbUrl);
        if (thumbRes.ok) {
          const thumbArrayBuffer = await thumbRes.arrayBuffer();
          const contentType = thumbRes.headers.get("content-type") || "image/jpeg";

          return new NextResponse(new Uint8Array(thumbArrayBuffer), {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
            },
          });
        }
      } catch (thumbErr) {
        console.warn("High-res thumbnail fetch failed, falling back to alt=media:", thumbErr);
      }
    }

    // 3. Fallback: Stream raw original file bytes directly from Google Drive
    const response = await drive.files.get(
      { fileId: id, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Google Drive image stream error:", error);
    return NextResponse.json(
      { error: "Failed to stream image from Google Drive: " + (error?.message || "Unknown error") },
      { status: 404 }
    );
  }
}
