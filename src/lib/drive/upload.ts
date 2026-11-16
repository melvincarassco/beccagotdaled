/**
 * Google Drive upload helper — used only when Supabase storage failover is triggered.
 * Uploads a file buffer to the configured wedding Drive folder and returns
 * the resulting file ID so images can be served via the existing Drive proxy.
 *
 * Uses drive.file scope (write-capable) in addition to drive.readonly.
 */

import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

/**
 * Returns a Google Drive client with BOTH read and write (drive.file) scopes.
 * Separate from the read-only client used for syncing.
 */
function getGoogleDriveWriteClient() {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || clientEmail.includes("your-service-account")) {
    const candidateFiles = [
      "becca-514703-7e6b1cf71dc1.json",
      "google-service-account.json",
      "service-account.json",
    ];

    for (const filename of candidateFiles) {
      try {
        const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), filename);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (content.client_email && content.private_key) {
            clientEmail = content.client_email;
            privateKey = content.private_key;
            break;
          }
        }
      } catch {}
    }
  }

  if (!clientEmail || !privateKey) return null;

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    // drive.file = only files this app creates/opens; drive.readonly = read existing
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Uploads a file buffer to the configured Google Drive wedding folder.
 * Returns the Drive file ID on success, or null on failure.
 */
export async function uploadBufferToDrive(params: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  folderDescription?: string;
}): Promise<string | null> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    console.error("[drive-upload] GOOGLE_DRIVE_FOLDER_ID not set");
    return null;
  }

  const drive = getGoogleDriveWriteClient();
  if (!drive) {
    console.error("[drive-upload] Could not initialise Drive write client");
    return null;
  }

  try {
    const stream = Readable.from(params.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: `guest-failover_${Date.now()}_${params.filename}`,
        parents: [folderId],
        description:
          params.folderDescription || "Guest upload — Supabase storage failover",
      },
      media: {
        mimeType: params.mimeType,
        body: stream,
      },
      fields: "id",
    });

    const fileId = response.data.id;
    if (!fileId) {
      console.error("[drive-upload] Drive returned no file ID");
      return null;
    }

    return fileId;
  } catch (err: any) {
    console.error("[drive-upload] Upload failed:", err?.message || err);
    return null;
  }
}
