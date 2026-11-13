import { NextResponse } from "next/server";

export async function GET() {
  const hasServiceAccountEmail = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const hasPrivateKey = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  const isConfigured = hasServiceAccountEmail && hasPrivateKey && Boolean(folderId);

  return NextResponse.json({
    isConfigured,
    hasServiceAccountEmail,
    hasPrivateKey,
    folderId,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      ? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.replace(/(.{4})(.*)(@.*)/, "$1...$3")
      : null,
  });
}
