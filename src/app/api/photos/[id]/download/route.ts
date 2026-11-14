import { NextRequest, NextResponse } from "next/server";
import { getPhotoById } from "@/lib/db/photos";
import { getGoogleDriveClient } from "@/lib/drive/client";

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
      } catch {
        const resp = await fetch(photo.display_url);
        imageBuffer = Buffer.from(await resp.arrayBuffer());
      }
    } else {
      const resp = await fetch(photo.display_url);
      imageBuffer = Buffer.from(await resp.arrayBuffer());
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
