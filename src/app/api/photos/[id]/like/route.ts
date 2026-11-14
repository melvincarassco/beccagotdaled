import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuestSession } from "@/lib/auth/guest-session";
import { togglePhotoLike } from "@/lib/db/photos";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentGuestSession();
    let guestId = session?.id;

    if (!guestId) {
      try {
        const body = await request.json();
        guestId = body.guestId;
      } catch {}
    }

    if (!guestId) {
      guestId = "guest-anonymous-visitor";
    }

    const result = await togglePhotoLike(id, guestId);

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error: any) {
    console.error("Like error:", error);
    return NextResponse.json({ error: error.message || "Failed to update like status" }, { status: 500 });
  }
}
