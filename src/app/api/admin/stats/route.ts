import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db/guests";
import { getPhotoStats } from "@/lib/db/photos";
import { getAnalyticsData } from "@/lib/db/analytics";
import { getUsageSummary } from "@/lib/supabase/storage-usage";

export async function GET() {
  try {
    const [guests, photoStats, analytics, storageSummary] = await Promise.all([
      getAllGuests(),
      getPhotoStats(),
      getAnalyticsData(),
      getUsageSummary(),
    ]);

    const activeGuests = guests.filter((g) => g.is_active).length;
    const inactiveGuests = guests.length - activeGuests;

    return NextResponse.json({
      guests: {
        total: guests.length,
        active: activeGuests,
        inactive: inactiveGuests,
      },
      photos: photoStats,
      analytics: {
        totalLogins: analytics.totalLogins,
        uniqueGuestsCount: analytics.uniqueGuestsCount,
        totalDownloads: analytics.totalDownloads,
        recentDownloads: analytics.recentDownloads.slice(0, 5),
      },
      activity: {
        lastSyncedAt: new Date().toISOString(),
      },
      storage: {
        usedMB: storageSummary.usedMB,
        limitMB: storageSummary.limitMB,
        percentUsed: storageSummary.percentUsed,
        isNearLimit: storageSummary.isNearLimit,
        failoverActive: storageSummary.isNearLimit,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
