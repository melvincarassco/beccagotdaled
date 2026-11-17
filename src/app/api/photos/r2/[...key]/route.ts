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

    return new NextResponse(new Uint8Array(obj.buffer), {
      status: 200,
      headers: {
        "Content-Type": obj.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err: any) {
    console.error("R2 view proxy error:", err);
    return NextResponse.json({ error: "Failed to load photo from R2" }, { status: 500 });
  }
}
