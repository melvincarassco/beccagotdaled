import { createAdminClient } from "@/lib/supabase/admin";
import { Photo, ModerationStatus, UploadSource, GalleryFilterOptions, Like } from "@/types";
import fs from "fs/promises";
import path from "path";

// In-memory fallback photo store initialized with curated official & guest photos
let localPhotosStore: Photo[] = [
  {
    id: "photo-drive-01",
    drive_file_id: "1A2B3C4D5E6F7G8H9I0-drive",
    filename: "Becca_Dale_Surrey_Golden_Hour.jpg",
    mime_type: "image/jpeg",
    caption: "The golden hour embrace under Surrey oaks ✨💍",
    uploaded_by: null,
    uploader_name: "Rebecca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: false,
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
    uploader_name: "Rebecca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: false,
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
    caption: "Rebecca looking ethereal in bridal silk satin 🤍",
    uploaded_by: null,
    uploader_name: "Rebecca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: false,
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
    watermark_applied: false,
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
    watermark_applied: false,
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
    uploader_name: "Rebecca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: false,
    thumbnail_url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=85",
    width: 2000,
    height: 1333,
    uploaded_at: "2026-11-14T11:00:00Z",
    last_synced_at: "2026-11-14T18:00:00Z",
    like_count: 24,
  },
];

// In-memory fallback likes store
let localLikesStore: Like[] = [
  { id: "like-01", guest_id: "guest-becca-01", photo_id: "photo-drive-01", created_at: "2026-11-14T18:00:00Z" },
  { id: "like-02", guest_id: "guest-becca-01", photo_id: "photo-drive-03", created_at: "2026-11-14T18:05:00Z" },
];

/**
 * Sanitizes user caption string and caps length at 280 characters
 */
export function sanitizeCaption(caption?: string | null): string | null {
  if (!caption) return null;
  const trimmed = caption.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 280);
}

/**
 * Creates a new photo upload from an authenticated guest.
 * (Note: Per user requirement, watermarks are not forcibly added to uploaded images)
 */
export async function createGuestPhotoUpload(data: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  caption?: string | null;
  uploadedByGuestId: string;
  uploaderName: string;
}): Promise<Photo> {
  const sanitizedCaption = sanitizeCaption(data.caption);
  const photoId = `photo-guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Save clean original photo to local uploads storage
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeFilename = `${photoId}_${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await fs.writeFile(path.join(uploadsDir, safeFilename), data.buffer);

    const displayUrl = `/uploads/${safeFilename}`;

    const newPhoto: Photo = {
      id: photoId,
      drive_file_id: null,
      filename: data.filename,
      mime_type: data.mimeType,
      caption: sanitizedCaption,
      uploaded_by: data.uploadedByGuestId,
      uploader_name: data.uploaderName,
      upload_source: "guest_upload",
      moderation_status: "pending",
      watermark_applied: false,
      original_storage_path: displayUrl,
      watermarked_storage_path: null,
      thumbnail_url: displayUrl,
      display_url: displayUrl,
      width: 1920,
      height: 1080,
      uploaded_at: new Date().toISOString(),
      like_count: 0,
    };

    localPhotosStore.unshift(newPhoto);
    return newPhoto;
  } catch (err) {
    console.error("Local file write error:", err);
    const newPhoto: Photo = {
      id: photoId,
      drive_file_id: null,
      filename: data.filename,
      mime_type: data.mimeType,
      caption: sanitizedCaption,
      uploaded_by: data.uploadedByGuestId,
      uploader_name: data.uploaderName,
      upload_source: "guest_upload",
      moderation_status: "pending",
      watermark_applied: false,
      thumbnail_url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
      display_url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85",
      width: 1920,
      height: 1080,
      uploaded_at: new Date().toISOString(),
      like_count: 0,
    };
    localPhotosStore.unshift(newPhoto);
    return newPhoto;
  }
}

/**
 * Toggles like for a photo by a guest (prevents duplicate likes)
 */
export async function togglePhotoLike(
  photoId: string,
  guestId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const photo = localPhotosStore.find((p) => p.id === photoId);
  if (!photo) {
    throw new Error("Photo not found");
  }

  const existingIndex = localLikesStore.findIndex(
    (l) => l.photo_id === photoId && l.guest_id === guestId
  );

  let liked = false;
  if (existingIndex !== -1) {
    // Unlike
    localLikesStore.splice(existingIndex, 1);
    photo.like_count = Math.max(0, photo.like_count - 1);
    liked = false;
  } else {
    // Like
    localLikesStore.push({
      id: `like-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      guest_id: guestId,
      photo_id: photoId,
      created_at: new Date().toISOString(),
    });
    photo.like_count += 1;
    liked = true;
  }

  // Supabase sync if configured
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      if (liked) {
        await adminClient.from("likes").insert({ guest_id: guestId, photo_id: photoId });
      } else {
        await adminClient.from("likes").delete().eq("guest_id", guestId).eq("photo_id", photoId);
      }
    } catch {}
  }

  return { liked, likeCount: photo.like_count };
}

/**
 * Returns list of photo IDs liked by a guest
 */
export async function getLikedPhotoIds(guestId?: string | null): Promise<string[]> {
  if (!guestId) return [];
  return localLikesStore
    .filter((l) => l.guest_id === guestId)
    .map((l) => l.photo_id);
}

/**
 * Retrieves all favourite photos for a guest
 */
export async function getFavouritePhotos(guestId?: string | null): Promise<Photo[]> {
  if (!guestId) return [];
  const likedIds = await getLikedPhotoIds(guestId);
  return localPhotosStore.filter((p) => likedIds.includes(p.id) && p.moderation_status === "approved");
}

/**
 * Updates a photo caption (with permission check: uploader or admin)
 */
export async function updatePhotoCaption(
  photoId: string,
  newCaption: string,
  editorGuestId?: string,
  isAdmin?: boolean
): Promise<{ success: boolean; photo?: Photo; error?: string }> {
  const photo = localPhotosStore.find((p) => p.id === photoId);
  if (!photo) {
    return { success: false, error: "Photo not found." };
  }

  if (!isAdmin && editorGuestId && photo.uploaded_by !== editorGuestId) {
    return {
      success: false,
      error: "You are only permitted to edit captions on photographs you contributed.",
    };
  }

  photo.caption = sanitizeCaption(newCaption);
  return { success: true, photo };
}

/**
 * Updates a photo moderation status (Approve or Reject)
 */
export async function updatePhotoModeration(
  photoId: string,
  status: ModerationStatus
): Promise<Photo | null> {
  const photo = localPhotosStore.find((p) => p.id === photoId);
  if (!photo) return null;
  photo.moderation_status = status;
  return photo;
}

/**
 * Retrieves all pending photos for the admin moderation queue
 */
export async function getPendingPhotos(): Promise<Photo[]> {
  return localPhotosStore.filter((p) => p.moderation_status === "pending");
}

/**
 * Deletes a photo completely
 */
export async function deletePhoto(photoId: string): Promise<boolean> {
  const initialLen = localPhotosStore.length;
  localPhotosStore = localPhotosStore.filter((p) => p.id !== photoId);
  return localPhotosStore.length < initialLen;
}

/**
 * Retrieves all approved photos with optional filters
 */
export async function getApprovedPhotos(
  options?: GalleryFilterOptions & { currentGuestId?: string }
): Promise<Photo[]> {
  let photos = localPhotosStore.filter((p) => p.moderation_status === "approved");

  if (options?.source === "drive") {
    photos = photos.filter((p) => p.upload_source === "google_drive");
  } else if (options?.source === "guests") {
    photos = photos.filter((p) => p.upload_source === "guest_upload");
  }

  if (options?.sortBy === "most_liked") {
    photos.sort((a, b) => b.like_count - a.like_count);
  } else if (options?.sortBy === "oldest") {
    photos.sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
  } else {
    photos.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  // Attach is_liked_by_me if guest ID is provided
  if (options?.currentGuestId) {
    const likedIds = await getLikedPhotoIds(options.currentGuestId);
    photos = photos.map((p) => ({
      ...p,
      is_liked_by_me: likedIds.includes(p.id),
    }));
  }

  return photos;
}

/**
 * Retrieves a single photo by ID
 */
export async function getPhotoById(id: string): Promise<Photo | null> {
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
    uploader_name: "Rebecca & Dale (Official Archive)",
    upload_source: "google_drive",
    moderation_status: "approved",
    watermark_applied: false,
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
  const approved = all.filter((p) => p.moderation_status === "approved");
  const sortedByLikes = [...approved].sort((a, b) => b.like_count - a.like_count);

  return {
    totalPhotos: all.length,
    approvedPhotos: approved.length,
    drivePhotos: all.filter((p) => p.upload_source === "google_drive").length,
    guestPhotos: all.filter((p) => p.upload_source === "guest_upload").length,
    pendingModeration: all.filter((p) => p.moderation_status === "pending").length,
    totalLikes: all.reduce((sum, p) => sum + p.like_count, 0),
    mostLikedPhotos: sortedByLikes.slice(0, 5),
  };
}
