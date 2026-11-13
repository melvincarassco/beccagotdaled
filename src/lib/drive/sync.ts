import { getGoogleDriveClient } from "./client";
import { upsertDrivePhoto } from "@/lib/db/photos";

export interface SyncResult {
  success: boolean;
  folderId?: string;
  totalDiscovered: number;
  newAdded: number;
  updated: number;
  errors: string[];
  durationMs: number;
  isSimulated?: boolean;
}

/**
 * Synchronizes the Google Drive wedding folder with the database
 */
export async function syncGoogleDriveWeddingFolder(): Promise<SyncResult> {
  const startTime = Date.now();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const drive = getGoogleDriveClient();
  const errors: string[] = [];
  let totalDiscovered = 0;
  let newAdded = 0;
  let updated = 0;

  // If credentials or folder ID are not yet configured, run simulated wedding drive sync
  if (!drive || !folderId) {
    const simulatedFiles = [
      {
        id: "drive-file-sim-01",
        name: "Surrey_Sunset_First_Kiss.jpg",
        mimeType: "image/jpeg",
        thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
        displayUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85",
        caption: "Sunset first kiss under the floral arch #beccagotdaled",
        width: 2400,
        height: 1600,
      },
      {
        id: "drive-file-sim-02",
        name: "Ceremony_Vows_Emotional.jpg",
        mimeType: "image/jpeg",
        thumbnailUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
        displayUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85",
        caption: "Dale emotional during the exchange of rings 🤍",
        width: 2000,
        height: 1333,
      },
      {
        id: "drive-file-sim-03",
        name: "Glasshouse_Arbor_Vistas.jpg",
        mimeType: "image/jpeg",
        thumbnailUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80",
        displayUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=85",
        caption: "Glasshouse sanctuary bathed in afternoon sunlight 🌿",
        width: 1920,
        height: 1280,
      },
      {
        id: "drive-file-sim-04",
        name: "Becca_Dale_Confetti_Walk.jpg",
        mimeType: "image/jpeg",
        thumbnailUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80",
        displayUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=85",
        caption: "Rose petal confetti shower down the aisle! 🎉✨",
        width: 2400,
        height: 1600,
      },
    ];

    for (const file of simulatedFiles) {
      totalDiscovered++;
      const result = await upsertDrivePhoto({
        drive_file_id: file.id,
        filename: file.name,
        mime_type: file.mimeType,
        caption: file.caption,
        thumbnail_url: file.thumbnailUrl,
        display_url: file.displayUrl,
        width: file.width,
        height: file.height,
      });

      if (result.isNew) newAdded++;
      else updated++;
    }

    return {
      success: true,
      folderId: folderId || "simulated-wedding-drive-folder",
      totalDiscovered,
      newAdded,
      updated,
      errors: [],
      durationMs: Date.now() - startTime,
      isSimulated: true,
    };
  }

  // Real Google Drive API v3 Synchronization
  try {
    let pageToken: string | undefined = undefined;

    do {
      const response: any = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
        fields:
          "nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, imageMediaMetadata, size, createdTime, modifiedTime)",
        pageSize: 100,
        pageToken,
      });

      const files = response.data.files || [];
      totalDiscovered += files.length;

      for (const file of files) {
        if (!file.id || !file.name) continue;

        try {
          // Adjust thumbnail link to return high resolution (e.g. replace =s220 with =s1600)
          let highResThumb = file.thumbnailLink || "";
          if (highResThumb && highResThumb.includes("=s")) {
            highResThumb = highResThumb.replace(/=s\d+/, "=s1600");
          }

          const displayUrl = highResThumb || `/api/photos/drive/${file.id}/view`;

          const result = await upsertDrivePhoto({
            drive_file_id: file.id,
            filename: file.name,
            mime_type: file.mimeType || "image/jpeg",
            caption: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
            thumbnail_url: highResThumb || displayUrl,
            display_url: displayUrl,
            width: file.imageMediaMetadata?.width || 1920,
            height: file.imageMediaMetadata?.height || 1080,
          });

          if (result.isNew) {
            newAdded++;
          } else {
            updated++;
          }
        } catch (itemErr: any) {
          errors.push(`Error synchronizing ${file.name}: ${itemErr.message}`);
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return {
      success: true,
      folderId,
      totalDiscovered,
      newAdded,
      updated,
      errors,
      durationMs: Date.now() - startTime,
      isSimulated: false,
    };
  } catch (error: any) {
    console.error("Google Drive sync failed:", error);
    return {
      success: false,
      folderId,
      totalDiscovered,
      newAdded,
      updated,
      errors: [error.message || "Failed to communicate with Google Drive API v3."],
      durationMs: Date.now() - startTime,
    };
  }
}
