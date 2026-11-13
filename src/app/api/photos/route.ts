import { NextRequest, NextResponse } from "next/server";
import { getApprovedPhotos } from "@/lib/db/photos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = (searchParams.get("source") || "all") as "all" | "drive" | "guests";
    const sortBy = (searchParams.get("sortBy") || "latest") as "latest" | "most_liked" | "oldest";

    const photos = await getApprovedPhotos({ source, sortBy });

    return NextResponse.json({
      photos,
      total: photos.length,
      source,
    });
  } catch (error: any) {
    console.error("Photos API error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery photos." }, { status: 500 });
  }
}
