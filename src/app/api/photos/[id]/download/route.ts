import { NextRequest, NextResponse } from "next/server";
import { getPhotoById } from "@/lib/db/photos";
import { getGoogleDriveClient } from "@/lib/drive/client";
import sharp from "sharp";

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

    let imageBuffer: Buffer;

    // If photo has a Google Drive File ID and Drive client is configured, stream from Drive
    const drive = getGoogleDriveClient();
    if (photo.drive_file_id && drive) {
      try {
        const driveRes = await drive.files.get(
          { fileId: photo.drive_file_id, alt: "media" },
          { responseType: "arraybuffer" }
        );
        imageBuffer = Buffer.from(driveRes.data as ArrayBuffer);
      } catch (driveErr) {
        // Fallback to display URL fetch
        const resp = await fetch(photo.display_url);
        imageBuffer = Buffer.from(await resp.arrayBuffer());
      }
    } else {
      // Fetch from display URL
      const resp = await fetch(photo.display_url);
      imageBuffer = Buffer.from(await resp.arrayBuffer());
    }

    // Server-side watermarking with Sharp (Requirement 7 & Section 1: Server-side image processing using Sharp)
    // Create an elegant SVG overlay for "#beccagotdaled"
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1920;
    const height = metadata.height || 1080;

    const fontSize = Math.max(22, Math.round(width * 0.024));
    const paddingX = Math.round(width * 0.03);
    const paddingY = Math.round(height * 0.04);

    const svgWatermark = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: rgba(255, 255, 255, 0.88);
            font-family: Georgia, serif;
            font-style: italic;
            font-size: ${fontSize}px;
            letter-spacing: 0.18em;
          }
          .watermark-shadow {
            fill: rgba(0, 0, 0, 0.45);
            font-family: Georgia, serif;
            font-style: italic;
            font-size: ${fontSize}px;
            letter-spacing: 0.18em;
          }
        </style>
        <text x="${width - paddingX + 2}" y="${height - paddingY + 2}" text-anchor="end" class="watermark-shadow">#beccagotdaled</text>
        <text x="${width - paddingX}" y="${height - paddingY}" text-anchor="end" class="watermark-text">#beccagotdaled</text>
      </svg>
    `);

    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{ input: svgWatermark, top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toBuffer();

    const safeFilename = `beccagotdaled_${photo.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    return new NextResponse(new Uint8Array(watermarkedBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
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
