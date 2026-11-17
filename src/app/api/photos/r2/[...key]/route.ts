import { NextRequest, NextResponse } from "next/server";
import { getR2ObjectBuffer } from "@/lib/r2/upload";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keySegments } = await params;
    const key = keySegments.join("/");

    if (!key) {
      return NextResponse.json({ error: "Object key required" }, { status: 400 });
    }

    const obj = await getR2ObjectBuffer(key);

    if (!obj || !obj.buffer) {
      return NextResponse.json({ error: "Photo not found in R2" }, { status: 404 });
    }

    let buffer = obj.buffer;
    let mimeType = obj.mimeType || "image/jpeg";

    const isHeic =
      mimeType.includes("heic") ||
      mimeType.includes("heif") ||
      /\.hei[cf]$/i.test(key);

    // If HEIC image, transcode to universal JPEG on-the-fly for viewing so Android/Windows/Chrome render perfectly with no broken image box
    if (isHeic) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const convert = require("heic-convert");
        const converted = await convert({
          buffer,
          format: "JPEG",
          quality: 0.95,
        });
        buffer = Buffer.from(converted);
        mimeType = "image/jpeg";
      } catch (convErr) {
        console.warn("R2 on-the-fly HEIC view conversion failed, serving raw buffer:", convErr);
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err: any) {
    console.error("R2 view proxy error:", err);
    return NextResponse.json({ error: "Failed to load photo from R2" }, { status: 500 });
  }
}
