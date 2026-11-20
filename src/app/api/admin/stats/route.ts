import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db/guests";
import { getPhotoStats } from "@/lib/db/photos";
import { getAnalyticsData } from "@/lib/db/analytics";
import { getR2StorageUsage, R2_SAFETY_LIMIT_MB } from "@/lib/r2/upload";
import { isR2Configured } from "@/lib/r2/client";
import { getUsageSummary } from "@/lib/supabase/storage-usage";

export async function GET() {
  try {
    const [guests, photoStats, analytics, r2Usage] = await Promise.all([
      getAllGuests(),
      getPhotoStats(),
      getAnalyticsData(),
      isR2Configured() ? getR2StorageUsage() : null,
    ]);

    const activeGuests = guests.filter((g) => g.is_active).length;
    const inactiveGuests = guests.length - activeGuests;

    // Use Cloudflare R2 storage metrics exclusively when R2 is configured
    let storageMetrics = {
      provider: "r2",
      providerName: "Cloudflare R2",
      bucket: "beccagotdaled",
      usedMB: r2Usage?.usedMB ?? 0,
      limitMB: R2_SAFETY_LIMIT_MB, // 9,728 MB (~9.5 GB safety cap)
      percentUsed: r2Usage?.percentOfCap ?? 0,
      remainingMB: r2Usage?.remainingMB ?? R2_SAFETY_LIMIT_MB,
      isNearLimit: (r2Usage?.percentOfCap ?? 0) >= 90,
      failoverActive: false,
    };

    if (!isR2Configured()) {
      const storageSummary = await getUsageSummary();
      storageMetrics = {
        provider: "supabase",
        providerName: "Supabase Storage",
        bucket: "photos",
        usedMB: storageSummary.usedMB,
        limitMB: storageSummary.limitMB,
        percentUsed: storageSummary.percentUsed,
        remainingMB: Math.max(0, storageSummary.limitMB - storageSummary.usedMB),
        isNearLimit: storageSummary.isNearLimit,
        failoverActive: storageSummary.isNearLimit,
      };
    }

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
      storage: storageMetrics,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
