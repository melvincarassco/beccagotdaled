import { NextRequest, NextResponse } from "next/server";
import { getApprovedPhotos } from "@/lib/db/photos";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = (searchParams.get("source") || "all") as "all" | "drive" | "guests" | "my_uploads";
    const sortBy = (searchParams.get("sortBy") || "latest") as "latest" | "most_liked" | "oldest";

    const session = await getCurrentGuestSession();
    const currentGuestId = session?.id || searchParams.get("guestId") || undefined;

    const photos = await getApprovedPhotos({ source, sortBy, currentGuestId });

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
