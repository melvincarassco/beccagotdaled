import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db/guests";
import { getPhotoStats } from "@/lib/db/photos";

export async function GET() {
  try {
    const guests = await getAllGuests();
    const photoStats = await getPhotoStats();

    const activeGuests = guests.filter((g) => g.is_active).length;
    const inactiveGuests = guests.length - activeGuests;

    return NextResponse.json({
      guests: {
        total: guests.length,
        active: activeGuests,
        inactive: inactiveGuests,
      },
      photos: photoStats,
      activity: {
        lastSyncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
