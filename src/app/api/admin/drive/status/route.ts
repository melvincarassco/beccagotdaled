import { NextResponse } from "next/server";
import { getServiceAccountEmail, getGoogleDriveClient } from "@/lib/drive/client";

export async function GET() {
  const clientEmail = getServiceAccountEmail();
  const driveClient = getGoogleDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID && !process.env.GOOGLE_DRIVE_FOLDER_ID.includes("your-google-drive")
    ? process.env.GOOGLE_DRIVE_FOLDER_ID
    : null;

  const isConfigured = Boolean(driveClient) && Boolean(folderId);

  return NextResponse.json({
    isConfigured,
    hasServiceAccountEmail: Boolean(clientEmail),
    hasPrivateKey: Boolean(driveClient),
    folderId,
    clientEmail: clientEmail
      ? clientEmail.replace(/(.{4})(.*)(@.*)/, "$1...$3")
      : null,
    fullClientEmail: clientEmail,
  });
}
