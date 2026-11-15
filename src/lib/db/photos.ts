import fs from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { Photo, Like, GalleryFilterOptions } from "@/types";

// In-memory photo store (populated from database or runtime additions)
let localPhotosStore: Photo[] = [];

// In-memory likes store
let localLikesStore: Like[] = [];

/**
 * Flushes/deletes all existing photos from the database and local cache
 */
export async function flushAllPhotos(): Promise<{ flushedCount: number }> {
  let count = localPhotosStore.length;

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data } = await adminClient.from("photos").select("id");
      if (data) {
        count = Math.max(count, data.length);
      }
      // Delete all likes and photos from Supabase
      await adminClient.from("likes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await adminClient.from("photos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch (err) {
      console.error("Supabase flush error:", err);
    }
  }

  localPhotosStore = [];
  localLikesStore = [];

  // Clean up any local upload files except .gitkeep
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const files = await fs.readdir(uploadsDir);
    for (const f of files) {
      if (f !== ".gitkeep") {
        await fs.unlink(path.join(uploadsDir, f)).catch(() => {});
      }
    }
  } catch {}

  return { flushedCount: count };
}

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
  const safeFilename = `${photoId}_${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  let displayUrl = `/uploads/${safeFilename}`;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.uploadedByGuestId);
  const guestUuid = isUuid ? data.uploadedByGuestId : null;

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      // 1. Upload file buffer to Supabase Storage "photos" bucket
      const storagePath = `guest-uploads/${safeFilename}`;
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("photos")
        .upload(storagePath, data.buffer, {
          contentType: data.mimeType || "image/jpeg",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = adminClient.storage
          .from("photos")
          .getPublicUrl(storagePath);
        if (publicUrlData?.publicUrl) {
          displayUrl = publicUrlData.publicUrl;
        }
      } else if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
      }

      // 2. Insert into photos table with approved status so it appears immediately!
      const { data: dbPhoto, error: insertError } = await adminClient
        .from("photos")
        .insert({
          filename: data.filename,
          mime_type: data.mimeType,
          caption: sanitizedCaption,
          uploaded_by: guestUuid,
          upload_source: "guest_upload",
          moderation_status: "approved",
          watermark_applied: false,
          original_storage_path: displayUrl,
          watermarked_storage_path: data.uploaderName,
          thumbnail_url: displayUrl,
          display_url: displayUrl,
          width: 1920,
          height: 1080,
        })
        .select()
        .single();

      if (dbPhoto) {
        const guestPhoto: Photo = {
          ...dbPhoto,
          uploader_name: data.uploaderName,
          like_count: 0,
        };
        localPhotosStore.unshift(guestPhoto);
        return guestPhoto;
      } else if (insertError) {
        console.error("Supabase guest photo insert error:", insertError);
      }
    } catch (err) {
      console.error("Supabase guest photo insert error:", err);
    }
  }

  // Also write to local disk if running locally
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, safeFilename), data.buffer);
  } catch {}

  const newPhoto: Photo = {
    id: photoId,
    drive_file_id: null,
    filename: data.filename,
    mime_type: data.mimeType,
    caption: sanitizedCaption,
    uploaded_by: data.uploadedByGuestId,
    uploader_name: data.uploaderName,
    upload_source: "guest_upload",
    moderation_status: "approved",
    watermark_applied: false,
    original_storage_path: displayUrl,
    watermarked_storage_path: data.uploaderName,
    thumbnail_url: displayUrl,
    display_url: displayUrl,
    width: 1920,
    height: 1080,
    uploaded_at: new Date().toISOString(),
    like_count: 0,
  };

  localPhotosStore.unshift(newPhoto);
  return newPhoto;
}

/**
 * Toggles like for a photo by a guest (prevents duplicate likes)
 */
export async function togglePhotoLike(
  photoId: string,
  guestId: string
): Promise<{ liked: boolean; likeCount: number }> {
  let photo = localPhotosStore.find((p) => p.id === photoId);

  const existingIndex = localLikesStore.findIndex(
    (l) => l.photo_id === photoId && l.guest_id === guestId
  );

  let liked = false;
  if (existingIndex !== -1) {
    // Unlike
    localLikesStore.splice(existingIndex, 1);
    if (photo) photo.like_count = Math.max(0, photo.like_count - 1);
    liked = false;
  } else {
    // Like
    localLikesStore.push({
      id: `like-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      guest_id: guestId,
      photo_id: photoId,
      created_at: new Date().toISOString(),
    });
    if (photo) photo.like_count += 1;
    liked = true;
  }

  // Supabase sync if configured
  const adminClient = createAdminClient();
  let currentLikesCount = photo ? photo.like_count : 0;

  if (adminClient) {
    try {
      if (liked) {
        await adminClient.from("likes").insert({ guest_id: guestId, photo_id: photoId });
      } else {
        await adminClient.from("likes").delete().eq("guest_id", guestId).eq("photo_id", photoId);
      }
      const { count } = await adminClient
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("photo_id", photoId);
      if (count !== null) {
        currentLikesCount = count;
        if (photo) photo.like_count = count;
      }
    } catch (err) {
      console.error("Supabase toggle like error:", err);
    }
  }

  return { liked, likeCount: currentLikesCount };
}

/**
 * Returns list of photo IDs liked by a guest
 */
export async function getLikedPhotoIds(guestId?: string | null): Promise<string[]> {
  if (!guestId) return [];

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data } = await adminClient
        .from("likes")
        .select("photo_id")
        .eq("guest_id", guestId);
      if (data) {
        return data.map((row: any) => row.photo_id);
      }
    } catch {}
  }

  return localLikesStore
    .filter((like) => like.guest_id === guestId)
    .map((like) => like.photo_id);
}

/**
 * Retrieves all photos marked as favourite by a specific guest
 */
export async function getFavouritePhotos(guestId?: string | null): Promise<Photo[]> {
  if (!guestId) return [];
  const likedPhotoIds = await getLikedPhotoIds(guestId);
  const allPhotos = await getApprovedPhotos();
  return allPhotos.filter((p) => likedPhotoIds.includes(p.id));
}

/**
 * Updates caption of a photo in the admin moderation dashboard or by the uploader guest
 */
export async function updatePhotoCaption(
  photoId: string,
  newCaption: string,
  editorGuestId?: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; photo?: Photo; error?: string }> {
  const sanitized = sanitizeCaption(newCaption);
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      if (!isAdmin && editorGuestId) {
        const { data: existing } = await adminClient
          .from("photos")
          .select("uploaded_by")
          .eq("id", photoId)
          .maybeSingle();

        if (existing && existing.uploaded_by && existing.uploaded_by !== editorGuestId) {
          return { success: false, error: "Only the original uploader or an administrator can edit this caption." };
        }
      }

      const { data } = await adminClient
        .from("photos")
        .update({ caption: sanitized })
        .eq("id", photoId)
        .select()
        .single();

      if (data) {
        return { success: true, photo: data as Photo };
      }
    } catch (err: any) {
      console.error("Supabase caption update error:", err);
    }
  }

  const photo = localPhotosStore.find((p) => p.id === photoId);
  if (!photo) return { success: false, error: "Photo not found" };

  if (!isAdmin && editorGuestId && photo.uploaded_by && photo.uploaded_by !== editorGuestId) {
    return { success: false, error: "Only the original uploader can edit this caption." };
  }

  photo.caption = sanitized;
  return { success: true, photo };
}

/**
 * Updates moderation status of a photo (pending | approved | rejected)
 */
export async function updatePhotoModeration(
  photoId: string,
  status: "pending" | "approved" | "rejected"
): Promise<Photo | null> {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data } = await adminClient
        .from("photos")
        .update({ moderation_status: status })
        .eq("id", photoId)
        .select()
        .single();
      if (data) {
        return data as Photo;
      }
    } catch {}
  }

  const photo = localPhotosStore.find((p) => p.id === photoId);
  if (!photo) return null;
  photo.moderation_status = status;
  return photo;
}

/**
 * Retrieves all photos in 'pending' moderation status
 */
export async function getPendingPhotos(): Promise<Photo[]> {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("photos")
        .select("*")
        .eq("moderation_status", "pending")
        .order("uploaded_at", { ascending: false });
      if (!error && data) {
        return data as Photo[];
      }
    } catch {}
  }
  return localPhotosStore.filter((p) => p.moderation_status === "pending");
}

/**
 * Permanently deletes a photo
 */
export async function deletePhoto(photoId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      await adminClient.from("photos").delete().eq("id", photoId);
    } catch {}
  }
  const idx = localPhotosStore.findIndex((p) => p.id === photoId);
  if (idx !== -1) {
    localPhotosStore.splice(idx, 1);
  }
  return true;
}

/**
 * Retrieves all approved photos for the guest gallery
 */
export async function getApprovedPhotos(
  options?: GalleryFilterOptions & { currentGuestId?: string }
): Promise<Photo[]> {
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      let query = adminClient
        .from("photos")
        .select("*, guests(first_name, last_name), likes(count)")
        .eq("moderation_status", "approved");

      if (options?.source === "drive") {
        query = query.eq("upload_source", "google_drive");
      } else if (options?.source === "guests") {
        query = query.eq("upload_source", "guest_upload");
      }

      if (options?.sortBy === "oldest") {
        query = query.order("uploaded_at", { ascending: true });
      } else {
        query = query.order("uploaded_at", { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        let photos: Photo[] = data.map((row: any) => {
          let uploaderName = "Wedding Guest";
          if (row.upload_source === "google_drive") {
            uploaderName = "Rebecca & Dale";
          } else if (row.guests?.first_name) {
            uploaderName = `${row.guests.first_name} ${row.guests.last_name || ""}`.trim();
          } else if (row.watermarked_storage_path) {
            uploaderName = row.watermarked_storage_path;
          }

          return {
            id: row.id,
            drive_file_id: row.drive_file_id,
            filename: row.filename,
            mime_type: row.mime_type,
            caption: row.caption,
            uploaded_by: row.uploaded_by,
            uploader_name: uploaderName,
            upload_source: row.upload_source,
            moderation_status: row.moderation_status,
            watermark_applied: row.watermark_applied || false,
            original_storage_path: row.original_storage_path,
            watermarked_storage_path: row.watermarked_storage_path,
            thumbnail_url: row.thumbnail_url || row.display_url,
            display_url: row.display_url,
            width: row.width || 1920,
            height: row.height || 1080,
            uploaded_at: row.uploaded_at,
            last_synced_at: row.last_synced_at,
            like_count: row.likes?.[0]?.count || 0,
          };
        });

        if (options?.sortBy === "most_liked") {
          photos.sort((a, b) => b.like_count - a.like_count);
        }

        if (options?.currentGuestId) {
          const likedIds = await getLikedPhotoIds(options.currentGuestId);
          photos = photos.map((p) => ({
            ...p,
            is_liked_by_me: likedIds.includes(p.id),
          }));
        }

        return photos;
      }
    } catch (err) {
      console.error("Supabase getApprovedPhotos error:", err);
    }
  }

  // Fallback to local in-memory store if Supabase is unconfigured or failed
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
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("photos")
        .select("*, likes(count)")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          drive_file_id: data.drive_file_id,
          filename: data.filename,
          mime_type: data.mime_type,
          caption: data.caption,
          uploaded_by: data.uploaded_by,
          uploader_name: data.upload_source === "google_drive" ? "Rebecca & Dale" : "Wedding Guest",
          upload_source: data.upload_source,
          moderation_status: data.moderation_status,
          watermark_applied: data.watermark_applied || false,
          original_storage_path: data.original_storage_path,
          watermarked_storage_path: data.watermarked_storage_path,
          thumbnail_url: data.thumbnail_url || data.display_url,
          display_url: data.display_url,
          width: data.width || 1920,
          height: data.height || 1080,
          uploaded_at: data.uploaded_at,
          last_synced_at: data.last_synced_at,
          like_count: data.likes?.[0]?.count || 0,
        };
      }
    } catch {}
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
  let isNew = true;
  let photoResult: Photo | null = null;

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data: existing } = await adminClient
        .from("photos")
        .select("*")
        .eq("drive_file_id", photoData.drive_file_id)
        .maybeSingle();

      if (existing) {
        isNew = false;
        const { data: updated } = await adminClient
          .from("photos")
          .update({
            filename: photoData.filename,
            thumbnail_url: photoData.thumbnail_url,
            display_url: photoData.display_url,
            width: photoData.width || existing.width || 1920,
            height: photoData.height || existing.height || 1080,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (updated) {
          photoResult = updated as Photo;
        }
      } else {
        const { data: inserted } = await adminClient
          .from("photos")
          .insert({
            drive_file_id: photoData.drive_file_id,
            filename: photoData.filename,
            mime_type: photoData.mime_type,
            caption: photoData.caption || `Wedding celebration capture - ${photoData.filename.replace(/\.[^/.]+$/, "")}`,
            upload_source: "google_drive",
            moderation_status: "approved",
            watermark_applied: false,
            thumbnail_url: photoData.thumbnail_url,
            display_url: photoData.display_url,
            width: photoData.width || 1920,
            height: photoData.height || 1080,
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (inserted) {
          photoResult = inserted as Photo;
        }
      }
    } catch (err) {
      console.error("Supabase upsertDrivePhoto error:", err);
    }
  }

  // Also maintain in local store
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
    return { photo: photoResult || localPhotosStore[existingIdx], isNew: false };
  }

  const newLocalPhoto: Photo = {
    id: photoResult?.id || `photo-drive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    drive_file_id: photoData.drive_file_id,
    filename: photoData.filename,
    mime_type: photoData.mime_type,
    caption: photoData.caption || `Wedding celebration capture - ${photoData.filename.replace(/\.[^/.]+$/, "")}`,
    uploaded_by: null,
    uploader_name: "Rebecca & Dale",
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

  localPhotosStore.unshift(newLocalPhoto);
  return { photo: photoResult || newLocalPhoto, isNew };
}

/**
 * Returns summary stats of photos for the admin dashboard
 */
export async function getPhotoStats() {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data: allPhotos } = await adminClient.from("photos").select("upload_source, moderation_status, id");
      const { count: totalLikes } = await adminClient.from("likes").select("*", { count: "exact", head: true });

      if (allPhotos) {
        const approved = allPhotos.filter((p: any) => p.moderation_status === "approved");
        return {
          totalPhotos: allPhotos.length,
          approvedPhotos: approved.length,
          drivePhotos: allPhotos.filter((p: any) => p.upload_source === "google_drive").length,
          guestPhotos: allPhotos.filter((p: any) => p.upload_source === "guest_upload").length,
          pendingModeration: allPhotos.filter((p: any) => p.moderation_status === "pending").length,
          totalLikes: totalLikes || 0,
          mostLikedPhotos: [],
        };
      }
    } catch (err) {
      console.error("Supabase getPhotoStats error:", err);
    }
  }

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
