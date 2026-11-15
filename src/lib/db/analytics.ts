import { createAdminClient } from "@/lib/supabase/admin";

export interface LoginEvent {
  id: string;
  guestId: string;
  guestName: string;
  timestamp: string;
  userAgent?: string;
}

export interface DownloadEvent {
  id: string;
  guestId: string;
  guestName: string;
  photoId: string;
  photoFilename: string;
  photoCaption?: string | null;
  photoThumbnail?: string | null;
  timestamp: string;
}

export interface GuestLoginSummary {
  guestId: string;
  guestName: string;
  loginCount: number;
  lastLoginAt: string;
}

export interface PhotoDownloadSummary {
  photoId: string;
  photoFilename: string;
  photoCaption?: string | null;
  photoThumbnail?: string | null;
  count: number;
  downloadedBy: string[];
  lastDownloadedAt: string;
}

export interface GuestDownloadSummary {
  guestName: string;
  count: number;
  photos: string[];
  lastDownloadedAt: string;
}

export interface AnalyticsData {
  totalLogins: number;
  uniqueGuestsCount: number;
  recentLogins: LoginEvent[];
  guestLoginsSummary: GuestLoginSummary[];
  totalDownloads: number;
  uniquePhotosDownloaded: number;
  recentDownloads: DownloadEvent[];
  downloadsByPhoto: PhotoDownloadSummary[];
  downloadsByGuest: GuestDownloadSummary[];
}

// In-memory fallback stores
const localLogins: LoginEvent[] = [];
const localDownloads: DownloadEvent[] = [];

/**
 * Records a guest login audit event
 */
export async function recordLoginEvent(data: {
  guestId: string;
  guestName: string;
  userAgent?: string;
}): Promise<void> {
  const event: LoginEvent = {
    id: crypto.randomUUID(),
    guestId: data.guestId,
    guestName: data.guestName,
    timestamp: new Date().toISOString(),
    userAgent: data.userAgent?.slice(0, 150),
  };

  localLogins.unshift(event);
  if (localLogins.length > 500) localLogins.pop();

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      await adminClient.from("admins").insert({
        email: `login:${JSON.stringify(event)}`,
        role: "moderator",
      });
    } catch (err) {
      console.error("Supabase recordLogin error:", err);
    }
  }
}

/**
 * Records a photo download event by a guest
 */
export async function recordDownloadEvent(data: {
  guestId: string;
  guestName: string;
  photoId: string;
  photoFilename: string;
  photoCaption?: string | null;
  photoThumbnail?: string | null;
}): Promise<void> {
  const event: DownloadEvent = {
    id: crypto.randomUUID(),
    guestId: data.guestId,
    guestName: data.guestName,
    photoId: data.photoId,
    photoFilename: data.photoFilename,
    photoCaption: data.photoCaption || null,
    photoThumbnail: data.photoThumbnail || null,
    timestamp: new Date().toISOString(),
  };

  localDownloads.unshift(event);
  if (localDownloads.length > 500) localDownloads.pop();

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      await adminClient.from("admins").insert({
        email: `download:${JSON.stringify(event)}`,
        role: "moderator",
      });
    } catch (err) {
      console.error("Supabase recordDownload error:", err);
    }
  }
}

/**
 * Retrieves aggregate analytics for logins and downloads
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  const allLogins: LoginEvent[] = [...localLogins];
  const allDownloads: DownloadEvent[] = [...localDownloads];

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("admins")
        .select("email, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        for (const row of data) {
          if (row.email?.startsWith("login:")) {
            try {
              const parsed: LoginEvent = JSON.parse(row.email.slice(6));
              if (!allLogins.some((l) => l.id === parsed.id)) {
                allLogins.push(parsed);
              }
            } catch {}
          } else if (row.email?.startsWith("download:")) {
            try {
              const parsed: DownloadEvent = JSON.parse(row.email.slice(9));
              if (!allDownloads.some((d) => d.id === parsed.id)) {
                allDownloads.push(parsed);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Supabase getAnalyticsData error:", err);
    }
  }

  // Sort by timestamp descending
  allLogins.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  allDownloads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Aggregate Logins by Guest
  const guestLoginsMap = new Map<string, { guestId: string; guestName: string; loginCount: number; lastLoginAt: string }>();
  for (const l of allLogins) {
    const key = l.guestId || l.guestName;
    const existing = guestLoginsMap.get(key);
    if (!existing) {
      guestLoginsMap.set(key, {
        guestId: l.guestId,
        guestName: l.guestName,
        loginCount: 1,
        lastLoginAt: l.timestamp,
      });
    } else {
      existing.loginCount += 1;
      if (new Date(l.timestamp).getTime() > new Date(existing.lastLoginAt).getTime()) {
        existing.lastLoginAt = l.timestamp;
      }
    }
  }

  const guestLoginsSummary: GuestLoginSummary[] = Array.from(guestLoginsMap.values()).sort(
    (a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
  );

  // Aggregate Downloads by Photo
  const photoDownloadsMap = new Map<
    string,
    {
      photoId: string;
      photoFilename: string;
      photoCaption?: string | null;
      photoThumbnail?: string | null;
      count: number;
      downloaders: Set<string>;
      lastDownloadedAt: string;
    }
  >();

  // Aggregate Downloads by Guest
  const guestDownloadsMap = new Map<
    string,
    {
      guestName: string;
      count: number;
      photos: Set<string>;
      lastDownloadedAt: string;
    }
  >();

  for (const d of allDownloads) {
    // By photo
    const pKey = d.photoId || d.photoFilename;
    const pExisting = photoDownloadsMap.get(pKey);
    if (!pExisting) {
      photoDownloadsMap.set(pKey, {
        photoId: d.photoId,
        photoFilename: d.photoFilename,
        photoCaption: d.photoCaption,
        photoThumbnail: d.photoThumbnail,
        count: 1,
        downloaders: new Set([d.guestName]),
        lastDownloadedAt: d.timestamp,
      });
    } else {
      pExisting.count += 1;
      pExisting.downloaders.add(d.guestName);
      if (new Date(d.timestamp).getTime() > new Date(pExisting.lastDownloadedAt).getTime()) {
        pExisting.lastDownloadedAt = d.timestamp;
      }
    }

    // By guest
    const gKey = d.guestName || "Guest";
    const gExisting = guestDownloadsMap.get(gKey);
    const photoLabel = d.photoCaption || d.photoFilename;
    if (!gExisting) {
      guestDownloadsMap.set(gKey, {
        guestName: gKey,
        count: 1,
        photos: new Set([photoLabel]),
        lastDownloadedAt: d.timestamp,
      });
    } else {
      gExisting.count += 1;
      gExisting.photos.add(photoLabel);
      if (new Date(d.timestamp).getTime() > new Date(gExisting.lastDownloadedAt).getTime()) {
        gExisting.lastDownloadedAt = d.timestamp;
      }
    }
  }

  const downloadsByPhoto: PhotoDownloadSummary[] = Array.from(photoDownloadsMap.values())
    .map((p) => ({
      photoId: p.photoId,
      photoFilename: p.photoFilename,
      photoCaption: p.photoCaption,
      photoThumbnail: p.photoThumbnail,
      count: p.count,
      downloadedBy: Array.from(p.downloaders),
      lastDownloadedAt: p.lastDownloadedAt,
    }))
    .sort((a, b) => b.count - a.count);

  const downloadsByGuest: GuestDownloadSummary[] = Array.from(guestDownloadsMap.values())
    .map((g) => ({
      guestName: g.guestName,
      count: g.count,
      photos: Array.from(g.photos),
      lastDownloadedAt: g.lastDownloadedAt,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLogins: allLogins.length,
    uniqueGuestsCount: guestLoginsMap.size,
    recentLogins: allLogins.slice(0, 100),
    guestLoginsSummary,
    totalDownloads: allDownloads.length,
    uniquePhotosDownloaded: photoDownloadsMap.size,
    recentDownloads: allDownloads.slice(0, 100),
    downloadsByPhoto,
    downloadsByGuest,
  };
}
