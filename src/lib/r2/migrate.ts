import { createAdminClient } from "@/lib/supabase/admin";
import { getGoogleDriveClient } from "@/lib/drive/client";
import { isR2Configured } from "./client";
import { uploadBufferToR2 } from "./upload";

export interface MigrationResult {
  total: number;
  migrated: number;
  alreadyInR2: number;
  failed: number;
  errors: string[];
}

/**
 * Safely copies all existing photos from Supabase Storage and Google Drive to Cloudflare R2.
 * Crucially: Leaves original source files untouched so NO images are deleted or vanished.
 */
export async function migrateAllPhotosToR2(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    alreadyInR2: 0,
    failed: 0,
    errors: [],
  };

  if (!isR2Configured()) {
    result.errors.push("Cloudflare R2 is not configured. Add R2 credentials in environment variables.");
    return result;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    result.errors.push("Supabase admin client could not be initialized.");
    return result;
  }

  const { data: photos, error: fetchErr } = await adminClient
    .from("photos")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (fetchErr || !photos) {
    result.errors.push(`Failed to fetch photos from database: ${fetchErr?.message || "Unknown error"}`);
    return result;
  }

  result.total = photos.length;
  const drive = getGoogleDriveClient();

  for (const photo of photos) {
    // 1. Skip if already migrated to R2
    if (photo.original_storage_path?.startsWith("r2://") || photo.display_url?.includes("/api/photos/r2/")) {
      result.alreadyInR2++;
      continue;
    }

    let buffer: Buffer | null = null;
    const mimeType = photo.mime_type || "image/jpeg";

    try {
      // 2. Fetch image buffer from Google Drive if stored in Drive
      let driveId = photo.drive_file_id;
      if (!driveId && photo.display_url?.includes("/api/photos/drive/")) {
        driveId = photo.display_url.split("/api/photos/drive/")[1]?.split("/")[0];
      }

      if (driveId && drive) {
        try {
          const driveRes = await drive.files.get(
            { fileId: driveId, alt: "media", supportsAllDrives: true },
            { responseType: "arraybuffer" }
          );
          buffer = Buffer.from(driveRes.data as ArrayBuffer);
        } catch (dErr: any) {
          console.warn(`Drive download failed for photo ${photo.id}:`, dErr.message);
        }
      }

      // 3. Fetch from Supabase Storage bucket
      if (!buffer) {
        const candidatePaths: string[] = [];
        const addPath = (p: string | null | undefined) => {
          if (!p) return;
          const clean = p.replace(/^\/+/, "");
          if (clean.includes("guest-uploads/")) {
            candidatePaths.push(clean.slice(clean.indexOf("guest-uploads/")));
          } else {
            candidatePaths.push(`guest-uploads/${clean}`);
            candidatePaths.push(clean);
            if (clean.startsWith("uploads/")) {
              candidatePaths.push(`guest-uploads/${clean.replace(/^uploads\//, "")}`);
              candidatePaths.push(clean.replace(/^uploads\//, ""));
            }
          }
        };

        addPath(photo.original_storage_path);
        if (photo.display_url && !photo.display_url.startsWith("http")) {
          addPath(photo.display_url);
        }

        for (const storagePath of [...new Set(candidatePaths)]) {
          try {
            const { data: fileBlob, error: dlErr } = await adminClient.storage
              .from("photos")
              .download(storagePath);

            if (!dlErr && fileBlob) {
              buffer = Buffer.from(await fileBlob.arrayBuffer());
              break;
            }
          } catch (storageErr) {
            console.warn(`Migration storage try failed for ${storagePath}:`, storageErr);
          }
        }
      }

      // 4. Fallback: fetch via public HTTP display_url
      if (!buffer && photo.display_url && photo.display_url.startsWith("http")) {
        try {
          const resp = await fetch(photo.display_url);
          if (resp.ok) {
            buffer = Buffer.from(await resp.arrayBuffer());
          }
        } catch {}
      }

      if (!buffer || buffer.length === 0) {
        result.failed++;
        result.errors.push(`Photo ${photo.id} (${photo.filename}): Could not download source bytes.`);
        continue;
      }

      // 5. Upload original untouched buffer to Cloudflare R2
      const safeFilename = `${photo.id}_${photo.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const r2Res = await uploadBufferToR2({
        filename: safeFilename,
        mimeType,
        buffer,
        prefix: "migrated-gallery",
      });

      if (!r2Res) {
        result.failed++;
        result.errors.push(`Photo ${photo.id} (${photo.filename}): R2 upload failed.`);
        continue;
      }

      // 6. Update database record to point to R2
      // DO NOT delete the original from Supabase / Drive — keeps backup 100% safe!
      const { error: updateErr } = await adminClient
        .from("photos")
        .update({
          original_storage_path: `r2://${r2Res.key}`,
          display_url: r2Res.displayUrl,
          thumbnail_url: r2Res.displayUrl,
        })
        .eq("id", photo.id);

      if (updateErr) {
        result.failed++;
        result.errors.push(`Photo ${photo.id}: Failed to update database pointer: ${updateErr.message}`);
      } else {
        result.migrated++;
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push(`Photo ${photo.id} (${photo.filename}): ${err.message || "Unknown error"}`);
    }
  }

  return result;
}
