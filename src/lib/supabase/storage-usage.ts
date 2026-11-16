/**
 * Supabase Storage usage checker — cached so we don't hammer the API on every upload.
 * Checks bucket size by summing file metadata from the storage API.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const FAILOVER_THRESHOLD_BYTES = 900 * 1024 * 1024; // 900 MB
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedUsageBytes: number | null = null;
let cacheExpiresAt: number = 0;

/**
 * Returns the total bytes used in the "photos" bucket (guest-uploads/ prefix).
 * Result is cached for 5 minutes to avoid per-upload overhead.
 */
export async function getGuestUploadBucketUsageBytes(): Promise<number> {
  const now = Date.now();
  if (cachedUsageBytes !== null && now < cacheExpiresAt) {
    return cachedUsageBytes;
  }

  const adminClient = createAdminClient();
  if (!adminClient) return 0;

  try {
    // List all files under guest-uploads/ — paginate up to 10,000 files
    let totalBytes = 0;
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data: files, error } = await adminClient.storage
        .from("photos")
        .list("guest-uploads", {
          limit: pageSize,
          offset,
          sortBy: { column: "created_at", order: "asc" },
        });

      if (error || !files || files.length === 0) break;

      for (const f of files) {
        totalBytes += f.metadata?.size ?? 0;
      }

      if (files.length < pageSize) break;
      offset += pageSize;
    }

    cachedUsageBytes = totalBytes;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return totalBytes;
  } catch (err) {
    console.error("[storage-usage] Error fetching bucket usage:", err);
    return cachedUsageBytes ?? 0;
  }
}

/**
 * Returns true when guest-upload bucket usage is at or above the 900 MB threshold.
 * Drive failover should be used when this returns true.
 */
export async function shouldFailoverToDrive(): Promise<boolean> {
  const usageBytes = await getGuestUploadBucketUsageBytes();
  return usageBytes >= FAILOVER_THRESHOLD_BYTES;
}

/**
 * Invalidates the cached usage figure — call after a successful upload
 * so the next check reflects the new file.
 */
export function invalidateUsageCache(): void {
  cachedUsageBytes = null;
  cacheExpiresAt = 0;
}

/**
 * Returns current usage as a human-readable string e.g. "234.5 MB / 1 GB"
 */
export async function getUsageSummary(): Promise<{
  usedBytes: number;
  usedMB: number;
  limitMB: number;
  percentUsed: number;
  isNearLimit: boolean;
}> {
  const usedBytes = await getGuestUploadBucketUsageBytes();
  const usedMB = usedBytes / (1024 * 1024);
  const limitMB = 1024; // 1 GB free tier
  const percentUsed = (usedMB / limitMB) * 100;
  return {
    usedBytes,
    usedMB: Math.round(usedMB * 10) / 10,
    limitMB,
    percentUsed: Math.round(percentUsed * 10) / 10,
    isNearLimit: usedMB >= 900,
  };
}
