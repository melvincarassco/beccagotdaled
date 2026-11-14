import { NextResponse } from "next/server";
import { flushAllPhotos } from "@/lib/db/photos";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export async function POST() {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await flushAllPhotos();
    return NextResponse.json({
      success: true,
      message: "Successfully flushed all existing photos and likes.",
      flushedCount: result.flushedCount,
    });
  } catch (error: any) {
    console.error("Photos flush error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to flush photos" },
      { status: 500 }
    );
  }
}
