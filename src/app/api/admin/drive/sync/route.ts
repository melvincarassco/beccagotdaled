import { NextResponse } from "next/server";
import { syncGoogleDriveWeddingFolder } from "@/lib/drive/sync";

export async function POST() {
  try {
    const result = await syncGoogleDriveWeddingFolder();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Drive sync error:", error);
    return NextResponse.json(
      {
        success: false,
        errors: [error.message || "Failed to trigger Google Drive synchronization"],
      },
      { status: 500 }
    );
  }
}
