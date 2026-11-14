import { google } from "googleapis";
import fs from "fs";
import path from "path";

/**
 * Initializes and returns the authenticated Google Drive API v3 client
 * using the server-side Service Account credentials from environment variables
 * or local JSON key file.
 */
export function getGoogleDriveClient() {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  // If environment variables are not set or are placeholder, attempt to read local service account JSON file
  if (!clientEmail || clientEmail.includes("your-service-account")) {
    const candidateFiles = [
      "becca-514703-7e6b1cf71dc1.json",
      "google-service-account.json",
      "service-account.json",
    ];

    for (const filename of candidateFiles) {
      const filePath = path.join(process.cwd(), filename);
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (content.client_email && content.private_key) {
            clientEmail = content.client_email;
            privateKey = content.private_key;
            break;
          }
        } catch {
          // ignore error
        }
      }
    }
  }

  if (!clientEmail || !privateKey) {
    return null;
  }

  // Handle environment variable formatting (escaped newlines or quotation marks)
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Returns the detected service account client email
 */
export function getServiceAccountEmail(): string | null {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.includes("your-service-account")) {
    return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  }
  const filePath = path.join(process.cwd(), "becca-514703-7e6b1cf71dc1.json");
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return content.client_email || null;
    } catch {}
  }
  return null;
}
