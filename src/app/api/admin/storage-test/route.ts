/**
 * Admin-only: storage failover health-check and dry-run upload test.
 *
 * GET  /api/admin/storage-test          → current status (usage, threshold, Drive connectivity)
 * POST /api/admin/storage-test          → dry-run: uploads a tiny test PNG to Drive and
 *                                         immediately deletes it, returns latency + file ID
 */

import { NextRequest, NextResponse } from "next/server";
import { getUsageSummary } from "@/lib/supabase/storage-usage";
import { isR2Configured } from "@/lib/r2/client";
import { checkR2Connection, uploadBufferToR2, deleteR2Object } from "@/lib/r2/upload";
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// ── Shared: build Drive write client ────────────────────────────────────────
function getDriveWriteClient() {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || clientEmail.includes("your-service-account")) {
    for (const f of ["becca-514703-7e6b1cf71dc1.json", "google-service-account.json", "service-account.json"]) {
      try {
        const fp = path.join(/*turbopackIgnore: true*/ process.cwd(), f);
        if (fs.existsSync(fp)) {
          const c = JSON.parse(fs.readFileSync(fp, "utf-8"));
          if (c.client_email && c.private_key) { clientEmail = c.client_email; privateKey = c.private_key; break; }
        }
      } catch {}
    }
  }

  if (!clientEmail || !privateKey) return null;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
  });
  return google.drive({ version: "v3", auth });
}

// ── GET: status check ────────────────────────────────────────────────────────
export async function GET() {
  const t0 = Date.now();

  // 1. Storage usage
  const storage = await getUsageSummary();

  // 2. Cloudflare R2 connectivity
  const r2Configured = isR2Configured();
  const r2Status = await checkR2Connection();

  // 3. Drive connectivity — just list 1 file from the wedding folder
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  let driveConnected = false;
  let driveError: string | null = null;

  const drive = getDriveWriteClient();
  if (!drive) {
    driveError = "Service account credentials not found";
  } else if (!folderId) {
    driveError = "GOOGLE_DRIVE_FOLDER_ID not set";
  } else {
    try {
      await drive.files.list({ q: `"${folderId}" in parents and trashed=false`, pageSize: 1, fields: "files(id)" });
      driveConnected = true;
    } catch (err: any) {
      driveError = err?.message || "Drive API error";
    }
  }

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - t0,
    r2: {
      configured: r2Configured,
      connected: r2Status.connected,
      bucket: r2Status.bucket,
      error: r2Status.error,
    },
    storage: {
      provider: r2Configured ? "Cloudflare R2" : "Supabase Storage",
      usedMB: r2Configured ? (r2Status.usedMB ?? 0) : storage.usedMB,
      limitMB: r2Configured ? 9728 : storage.limitMB,
      percentUsed: r2Configured ? (r2Status.percentOfCap ?? 0) : storage.percentUsed,
      thresholdMB: 900,
      isNearLimit: r2Configured ? (r2Status.percentOfCap ?? 0) >= 90 : storage.isNearLimit,
      failoverWouldTrigger: false,
      remainingMB: r2Configured
        ? (r2Status.remainingMB ?? 9728)
        : Math.round((storage.limitMB - storage.usedMB) * 10) / 10,
    },
    drive: {
      connected: driveConnected,
      folderId: folderId || null,
      error: driveError,
    },
  });
}

// ── POST: dry-run upload ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ simulate900mb: false, target: "auto" }));
  const { simulate900mb, target } = body;

  // Minimal 1×1 white PNG (67 bytes)
  const testPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  // If testing Cloudflare R2
  if (target === "r2" || (isR2Configured() && target !== "drive")) {
    const uploadStart = Date.now();
    try {
      const r2Res = await uploadBufferToR2({
        filename: `__storage-test__${Date.now()}.png`,
        mimeType: "image/png",
        buffer: testPng,
        prefix: "__tests__",
      });

      if (!r2Res) {
        return NextResponse.json({ ok: false, provider: "Cloudflare R2", stage: "upload", error: "Cloudflare R2 test upload failed" }, { status: 500 });
      }

      const uploadMs = Date.now() - uploadStart;
      const deletedOk = await deleteR2Object(r2Res.key);

      return NextResponse.json({
        ok: true,
        provider: "Cloudflare R2",
        dryRun: true,
        key: r2Res.key,
        deletedAfterTest: deletedOk,
        uploadLatencyMs: uploadMs,
        message: deletedOk
          ? `✅ Cloudflare R2 upload succeeded (${uploadMs}ms). Test file created and immediately deleted. R2 is connected & working with zero egress fees!`
          : `⚠️ Cloudflare R2 upload succeeded but cleanup failed.`,
      });
    } catch (err: any) {
      return NextResponse.json({ ok: false, provider: "Cloudflare R2", error: err.message }, { status: 500 });
    }
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json({ ok: false, error: "GOOGLE_DRIVE_FOLDER_ID not set" }, { status: 500 });
  }

  const drive = getDriveWriteClient();
  if (!drive) {
    return NextResponse.json({ ok: false, error: "Drive credentials not configured" }, { status: 500 });
  }

  const uploadStart = Date.now();
  let fileId: string | null = null;

  try {
    const res = await drive.files.create({
      requestBody: {
        name: `__storage-test__${Date.now()}.png`,
        parents: [folderId],
        description: "Automated storage-failover test — safe to delete",
      },
      media: { mimeType: "image/png", body: Readable.from(testPng) },
      fields: "id",
    });
    fileId = res.data.id ?? null;
  } catch (err: any) {
    let errorMsg = err?.message || "Drive upload failed";
    if (errorMsg.includes("Service Accounts do not have storage quota")) {
      errorMsg = "Google Drive rejected write: Google Service Accounts have 0 MB upload quota on personal @gmail.com Drive folders. Uploads to Drive only work if the folder is inside a Google Workspace Shared Drive (or via user OAuth). For personal Drive folders, service accounts have read-only access.";
    }
    return NextResponse.json({ ok: false, stage: "upload", error: errorMsg }, { status: 500 });
  }

  const uploadMs = Date.now() - uploadStart;

  // Immediately delete the test file so the Drive folder stays clean
  let deletedOk = false;
  if (fileId) {
    try {
      await drive.files.delete({ fileId });
      deletedOk = true;
    } catch {}
  }

  const storage = await getUsageSummary();

  return NextResponse.json({
    ok: true,
    dryRun: true,
    uploadedFileId: fileId,
    deletedAfterTest: deletedOk,
    uploadLatencyMs: uploadMs,
    simulatedFailover: simulate900mb,
    storage: {
      usedMB: storage.usedMB,
      percentUsed: storage.percentUsed,
      failoverWouldTrigger: simulate900mb || storage.isNearLimit,
    },
    message: deletedOk
      ? `✅ Drive upload succeeded (${uploadMs}ms). Test file created and immediately deleted. Failover is working.`
      : `⚠️ Drive upload succeeded but cleanup failed — file ID ${fileId} left in Drive folder.`,
  });
}
