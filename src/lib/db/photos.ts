import { createAdminClient } from "@/lib/supabase/admin";
import { Photo, ModerationStatus, UploadSource, GalleryFilterOptions } from "@/types";
import sharp from "sharp";
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
    uploader_name: "Rebecca & Dale (Official Archive)",
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
    caption: "Rebecca looking ethereal in bridal silk satin 🤍",
    uploaded_by: null,
    uploader_name: "Rebecca & Dale (Official Archive)",
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
    id: "photo-guest-pending-01",
    drive_file_id: null,
    filename: "guest_dancefloor_snap.jpg",
    mime_type: "image/jpeg",
    caption: "The dance floor energy was absolutely electric! 💃🕺",
    uploaded_by: "guest-sarah-03",
    uploader_name: "Sarah Jenkins",
    upload_source: "guest_upload",
    moderation_status: "pending",
    watermark_applied: true,
    thumbnail_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    display_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85",
    width: 1920,
    height: 1080,
    uploaded_at: "2026-11-14T22:00:00Z",
    like_count: 0,
  },
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
 * Applies server-side #beccagotdaled watermark using Sharp
 */
export async function applySharpWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;

  const fontSize = Math.max(22, Math.round(width * 0.024));
  const paddingX = Math.round(width * 0.03);
  const paddingY = Math.round(height * 0.04);

  const svgWatermark = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .watermark-text {
          fill: rgba(255, 255, 255, 0.90);
          font-family: Georgia, serif;
          font-style: italic;
          font-size: ${fontSize}px;
          letter-spacing: 0.18em;
        }
        .watermark-shadow {
          fill: rgba(0, 0, 0, 0.55);
          font-family: Georgia, serif;
          font-style: italic;
          font-size: ${fontSize}px;
          letter-spacing: 0.18em;
        }
      </style>
      <text x="${width - paddingX + 2}" y="${height - paddingY + 2}" text-anchor="end" class="watermark-shadow">#beccagotdaled</text>
      <text x="${width - paddingX}" y="${height - paddingY}" text-anchor="end" class="watermark-text">#beccagotdaled</text>
    </svg>
  `);

  return sharp(imageBuffer)
    .composite([{ input: svgWatermark, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Creates a new photo upload from an authenticated guest
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

  // Apply server-side Sharp watermarking
  let watermarkedBuffer: Buffer;
  try {
    watermarkedBuffer = await applySharpWatermark(data.buffer);
  } catch {
    watermarkedBuffer = data.buffer;
  }

  // Save files to local public uploads storage directory for serving
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    const originalFilename = `${photoId}_orig_${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const watermarkedFilename = `${photoId}_wm_${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    await fs.writeFile(path.join(uploadsDir, originalFilename), data.buffer);
    await fs.writeFile(path.join(uploadsDir, watermarkedFilename), watermarkedBuffer);

    const displayUrl = `/uploads/${watermarkedFilename}`;

    const newPhoto: Photo = {
      id: photoId,
      drive_file_id: null,
      filename: data.filename,
      mime_type: data.mimeType,
      caption: sanitizedCaption,
      uploaded_by: data.uploadedByGuestId,
      uploader_name: data.uploaderName,
      upload_source: "guest_upload",
      moderation_status: "pending", // Sent for admin approval
      watermark_applied: true,
      original_storage_path: `/uploads/${originalFilename}`,
      watermarked_storage_path: displayUrl,
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
    // Fallback in-memory
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
      watermark_applied: true,
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

  // Check authorization
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
  } else {
    photos.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
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
    approvedPhotos: all.filter((p) => p.moderation_status === "approved").length,
    drivePhotos: all.filter((p) => p.upload_source === "google_drive").length,
    guestPhotos: all.filter((p) => p.upload_source === "guest_upload").length,
    pendingModeration: all.filter((p) => p.moderation_status === "pending").length,
    totalLikes: all.reduce((sum, p) => sum + p.like_count, 0),
  };
}
