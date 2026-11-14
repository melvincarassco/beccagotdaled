import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { getFavouritePhotos } from "@/lib/db/photos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getCurrentGuestSession();
    const guestId = session?.id || searchParams.get("guestId");

    const favourites = await getFavouritePhotos(guestId);

    return NextResponse.json({
      photos: favourites,
      count: favourites.length,
    });
  } catch (error: any) {
    console.error("Favourites fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch favourite photos." }, { status: 500 });
  }
}
