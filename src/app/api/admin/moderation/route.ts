import { NextResponse } from "next/server";
import { getPendingPhotos, getPhotoStats } from "@/lib/db/photos";

export async function GET() {
  try {
    const pending = await getPendingPhotos();
    const stats = await getPhotoStats();

    return NextResponse.json({
      pending,
      count: pending.length,
      stats,
    });
  } catch (error: any) {
    console.error("Moderation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}
