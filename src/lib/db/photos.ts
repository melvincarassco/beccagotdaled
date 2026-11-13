import { createAdminClient } from "@/lib/supabase/admin";
import { Photo, ModerationStatus, UploadSource, GalleryFilterOptions } from "@/types";

// In-memory fallback photo store initialized with curated official & guest photos
let localPhotosStore: Photo[] = [
  {
    id: "photo-drive-01",
    drive_file_id: "1A2B3C4D5E6F7G8H9I0-drive",
    filename: "Becca_Dale_Surrey_Golden_Hour.jpg",
    mime_type: "image/jpeg",
    caption: "The golden hour embrace under Surrey oaks ✨💍",
    uploaded_by: null,
    uploader_name: "Becca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85",
    width: 2000,
    height: 1333,
    uploaded_at: "2026-11-14T17:30:00Z",
    last_synced_at: "2026-11-14T18:00:00Z",
    like_count: 42,
  },
  {
    id: "photo-drive-02",
    drive_file_id: "2B3C4D5E6F7G8H9I0J1-drive",
    filename: "Vow_Exchange_Arbor.jpg",
    mime_type: "image/jpeg",
    caption: "Exchange of vows beneath the floral arbor 🕊️",
    uploaded_by: null,
    uploader_name: "Becca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85",
    width: 2000,
    height: 1333,
    uploaded_at: "2026-11-14T14:45:00Z",
    last_synced_at: "2026-11-14T18:00:00Z",
    like_count: 38,
  },
  {
    id: "photo-drive-03",
    drive_file_id: "3C4D5E6F7G8H9I0J1K2-drive",
    filename: "Becca_Editorial_Silk_Portrait.jpg",
    mime_type: "image/jpeg",
    caption: "Becca looking ethereal in bridal silk satin 🤍",
    uploaded_by: null,
    uploader_name: "Becca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85",
    width: 1600,
    height: 2000,
    uploaded_at: "2026-11-14T13:15:00Z",
    last_synced_at: "2026-11-14T18:00:00Z",
    like_count: 56,
  },
  {
    id: "photo-guest-04",
    drive_file_id: null,
    filename: "table_cheers_table_4.jpg",
    mime_type: "image/jpeg",
    caption: "Our table cheering for Dale's speech! Incredible night! 🥂",
    uploaded_by: "guest-sarah-03",
    uploader_name: "Sarah Jenkins",
    upload_source: "guest_upload",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85",
    width: 2000,
    height: 1333,
    uploaded_at: "2026-11-14T20:10:00Z",
    like_count: 29,
  },
  {
    id: "photo-guest-05",
    drive_file_id: null,
    filename: "champagne_tower_marcus.jpg",
    mime_type: "image/jpeg",
    caption: "Champagne tower flowing non-stop 🍾✨",
    uploaded_by: "guest-marcus-04",
    uploader_name: "Marcus Vance",
    upload_source: "guest_upload",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1510076857177-7470076d4498?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1510076857177-7470076d4498?auto=format&fit=crop&w=1600&q=85",
    width: 2000,
    height: 1333,
    uploaded_at: "2026-11-14T21:40:00Z",
    like_count: 34,
  },
  {
    id: "photo-drive-06",
    drive_file_id: "6F7G8H9I0J1K2L3M4-drive",
    filename: "Floral_Arbor_Glasshouse.jpg",
    mime_type: "image/jpeg",
    caption: "The floral glasshouse sanctuary detail 🌿🌸",
    uploaded_by: null,
    uploader_name: "Becca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=85",
    width: 2000,
    height: 1333,
    uploaded_at: "2026-11-14T11:00:00Z",
    last_synced_at: "2026-11-14T18:00:00Z",
    like_count: 24,
  },
];

/**
 * Retrieves all approved photos with optional filters
 */
export async function getApprovedPhotos(
  options?: GalleryFilterOptions & { currentGuestId?: string }
): Promise<Photo[]> {
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      let query = adminClient
        .from("photos")
        .select("*, guests(first_name, last_name)")
        .eq("moderation_status", "approved");

      if (options?.source === "drive") {
        query = query.eq("upload_source", "google_drive");
      } else if (options?.source === "guests") {
        query = query.eq("upload_source", "guest_upload");
      }

      const { data, error } = await query.order("uploaded_at", { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          uploader_name: item.guests
            ? `${item.guests.first_name} ${item.guests.last_name}`
            : item.upload_source === "google_drive"
            ? "Becca & Dale (Official Archive)"
            : "Wedding Guest",
          like_count: item.like_count || 0,
        }));
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to local store
  let photos = localPhotosStore.filter((p) => p.moderation_status === "approved");

  if (options?.source === "drive") {
    photos = photos.filter((p) => p.upload_source === "google_drive");
  } else if (options?.source === "guests") {
    photos = photos.filter((p) => p.upload_source === "guest_upload");
  }

  if (options?.sortBy === "most_liked") {
    photos.sort((a, b) => b.like_count - a.like_count);
  } else {
    photos.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  return photos;
}

/**
 * Retrieves a single photo by ID
 */
export async function getPhotoById(id: string): Promise<Photo | null> {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("photos")
        .select("*, guests(first_name, last_name)")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          uploader_name: data.guests
            ? `${data.guests.first_name} ${data.guests.last_name}`
            : "Becca & Dale",
        } as Photo;
      }
    } catch {
      // Fallback
    }
  }

  const found = localPhotosStore.find((p) => p.id === id);
  return found || null;
}

/**
 * Upserts a Google Drive photo into database metadata
 */
export async function upsertDrivePhoto(photoData: {
  drive_file_id: string;
  filename: string;
  mime_type: string;
  caption?: string | null;
  thumbnail_url: string;
  display_url: string;
  width?: number;
  height?: number;
}): Promise<{ photo: Photo; isNew: boolean }> {
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      // Check existing
      const { data: existing } = await adminClient
        .from("photos")
        .select("id")
        .eq("drive_file_id", photoData.drive_file_id)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await adminClient
          .from("photos")
          .update({
            filename: photoData.filename,
            thumbnail_url: photoData.thumbnail_url,
            display_url: photoData.display_url,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        return { photo: updated as Photo, isNew: false };
      } else {
        const { data: inserted } = await adminClient
          .from("photos")
          .insert({
            drive_file_id: photoData.drive_file_id,
            filename: photoData.filename,
            mime_type: photoData.mime_type,
            caption: photoData.caption || null,
            upload_source: "google_drive",
            moderation_status: "approved",
            watermark_applied: true,
            thumbnail_url: photoData.thumbnail_url,
            display_url: photoData.display_url,
            width: photoData.width || 1920,
            height: photoData.height || 1080,
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();

        return { photo: inserted as Photo, isNew: true };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback store
  const existingIdx = localPhotosStore.findIndex(
    (p) => p.drive_file_id === photoData.drive_file_id
  );

  if (existingIdx !== -1) {
    localPhotosStore[existingIdx] = {
      ...localPhotosStore[existingIdx],
      filename: photoData.filename,
      thumbnail_url: photoData.thumbnail_url,
      display_url: photoData.display_url,
      last_synced_at: new Date().toISOString(),
    };
    return { photo: localPhotosStore[existingIdx], isNew: false };
  }

  const newPhoto: Photo = {
    id: `photo-drive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    drive_file_id: photoData.drive_file_id,
    filename: photoData.filename,
    mime_type: photoData.mime_type,
    caption: photoData.caption || `Wedding celebration capture - ${photoData.filename.replace(/\.[^/.]+$/, "")}`,
    uploaded_by: null,
    uploader_name: "Becca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: true,
    thumbnail_url: photoData.thumbnail_url,
    display_url: photoData.display_url,
    width: photoData.width || 1920,
    height: photoData.height || 1080,
    uploaded_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    like_count: 0,
  };

  localPhotosStore.unshift(newPhoto);
  return { photo: newPhoto, isNew: true };
}

/**
 * Returns summary stats of photos for the admin dashboard
 */
export async function getPhotoStats() {
  const all = localPhotosStore;
  return {
    totalPhotos: all.length,
    drivePhotos: all.filter((p) => p.upload_source === "google_drive").length,
    guestPhotos: all.filter((p) => p.upload_source === "guest_upload").length,
    pendingModeration: all.filter((p) => p.moderation_status === "pending").length,
    totalLikes: all.reduce((sum, p) => sum + p.like_count, 0),
  };
}
