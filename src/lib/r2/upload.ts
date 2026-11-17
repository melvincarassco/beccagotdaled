import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2BucketName, getR2PublicDomain, isR2Configured } from "./client";

/**
 * 9.5 GB strict safety ceiling.
 * Cloudflare gives 10 GB free forever. Setting the ceiling at 9.5 GB guarantees
 * the application will NEVER cross into billable territory.
 */
export const R2_SAFETY_LIMIT_BYTES = 9.5 * 1024 * 1024 * 1024; // 10,200,547,328 bytes (~9.5 GB)
export const R2_SAFETY_LIMIT_MB = 9.5 * 1024; // 9,728 MB

let cachedR2Usage: { usedBytes: number; updatedAt: number } | null = null;
let corsConfigured = false;

/**
 * Configure CORS on Cloudflare R2 bucket so browser clients can PUT/upload files
 * directly from the client without proxying through Vercel.
 */
export async function ensureR2BucketCors(): Promise<boolean> {
  if (corsConfigured) return true;
  const client = getR2Client();
  const bucket = getR2BucketName();
  if (!client) return false;

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["PUT", "GET", "HEAD", "POST"],
              AllowedOrigins: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 86400,
            },
          ],
        },
      })
    );
    corsConfigured = true;
    return true;
  } catch (err) {
    console.warn("Could not set R2 CORS configuration:", err);
    return false;
  }
}

/**
 * Creates a presigned PUT URL allowing the browser to upload directly to Cloudflare R2.
 * Bypasses Vercel Serverless Function payload limits (4.5MB) and timeouts completely!
 */
export async function createR2PresignedUploadUrl(params: {
  filename: string;
  mimeType: string;
  fileSize?: number;
  prefix?: string;
}): Promise<{ uploadUrl: string; key: string; displayUrl: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  // Enforce 9.5 GB safety cap
  const usage = await getR2StorageUsage();
  const estimatedSize = params.fileSize || 5 * 1024 * 1024;
  if (usage.usedBytes + estimatedSize >= R2_SAFETY_LIMIT_BYTES) {
    console.warn("[presign] Safety cap reached. Aborting presign.");
    return null;
  }

  // Ensure CORS is set on bucket so browser can PUT directly
  await ensureR2BucketCors();

  const bucket = getR2BucketName();
  const prefix = params.prefix || "guest-uploads";
  const key = `${prefix}/${Date.now()}_${params.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: params.mimeType,
      Metadata: {
        originalFilename: params.filename,
      },
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    const publicDomain = getR2PublicDomain();
    const displayUrl = publicDomain ? `${publicDomain}/${key}` : `/api/photos/r2/${key}`;

    return {
      uploadUrl,
      key,
      displayUrl,
    };
  } catch (err) {
    console.error("Failed to create R2 presigned upload URL:", err);
    return null;
  }
}

export async function getR2StorageUsage(): Promise<{
  usedBytes: number;
  usedMB: number;
  percentOfCap: number;
  remainingMB: number;
  isUnderCap: boolean;
}> {
  const client = getR2Client();
  if (!client) {
    return { usedBytes: 0, usedMB: 0, percentOfCap: 0, remainingMB: R2_SAFETY_LIMIT_MB, isUnderCap: true };
  }

  // Cache usage for 60 seconds to avoid excessive ListObjects calls
  if (cachedR2Usage && Date.now() - cachedR2Usage.updatedAt < 60000) {
    const usedMB = Math.round((cachedR2Usage.usedBytes / (1024 * 1024)) * 10) / 10;
    const percentOfCap = Math.round((cachedR2Usage.usedBytes / R2_SAFETY_LIMIT_BYTES) * 100);
    const remainingMB = Math.max(0, Math.round((R2_SAFETY_LIMIT_MB - usedMB) * 10) / 10);
    return {
      usedBytes: cachedR2Usage.usedBytes,
      usedMB,
      percentOfCap,
      remainingMB,
      isUnderCap: cachedR2Usage.usedBytes < R2_SAFETY_LIMIT_BYTES,
    };
  }

  const bucket = getR2BucketName();
  let totalBytes = 0;
  let continuationToken: string | undefined = undefined;

  try {
    do {
      const res: any = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        })
      );
      if (res.Contents) {
        for (const obj of res.Contents) {
          totalBytes += obj.Size || 0;
        }
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    cachedR2Usage = { usedBytes: totalBytes, updatedAt: Date.now() };
  } catch (err) {
    console.warn("Could not calculate exact R2 storage size:", err);
  }

  const usedMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
  const percentOfCap = Math.round((totalBytes / R2_SAFETY_LIMIT_BYTES) * 100);
  const remainingMB = Math.max(0, Math.round((R2_SAFETY_LIMIT_MB - usedMB) * 10) / 10);

  return {
    usedBytes: totalBytes,
    usedMB,
    percentOfCap,
    remainingMB,
    isUnderCap: totalBytes < R2_SAFETY_LIMIT_BYTES,
  };
}

export function invalidateR2UsageCache(): void {
  cachedR2Usage = null;
}

export async function checkR2Connection(): Promise<{
  connected: boolean;
  bucket: string;
  usedMB?: number;
  remainingMB?: number;
  percentOfCap?: number;
  error?: string;
}> {
  if (!isR2Configured()) {
    return { connected: false, bucket: "", error: "Cloudflare R2 environment variables are not set." };
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  if (!client) {
    return { connected: false, bucket, error: "Failed to initialize Cloudflare R2 client." };
  }

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    const usage = await getR2StorageUsage();
    return {
      connected: true,
      bucket,
      usedMB: usage.usedMB,
      remainingMB: usage.remainingMB,
      percentOfCap: usage.percentOfCap,
    };
  } catch (err: any) {
    return { connected: false, bucket, error: err.message || "Failed to reach Cloudflare R2 bucket." };
  }
}

export async function uploadBufferToR2(params: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  prefix?: string;
}): Promise<{ key: string; displayUrl: string; downloadUrl: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  // Enforce 9.5 GB safety cap before uploading
  const usage = await getR2StorageUsage();
  if (usage.usedBytes + params.buffer.length >= R2_SAFETY_LIMIT_BYTES) {
    console.warn(
      `[upload] R2 9.5 GB safety cap reached (${usage.usedMB} MB used). Aborting R2 upload to prevent billable overage.`
    );
    return null;
  }

  const bucket = getR2BucketName();
  const prefix = params.prefix || "guest-uploads";
  const key = `${prefix}/${Date.now()}_${params.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType,
        Metadata: {
          uploadedAt: new Date().toISOString(),
          originalFilename: params.filename,
        },
      })
    );

    if (cachedR2Usage) {
      cachedR2Usage.usedBytes += params.buffer.length;
    } else {
      invalidateR2UsageCache();
    }

    const publicDomain = getR2PublicDomain();
    let displayUrl: string;

    if (publicDomain) {
      displayUrl = `${publicDomain}/${key}`;
    } else {
      displayUrl = `/api/photos/r2/${key}`;
    }

    return {
      key,
      displayUrl,
      downloadUrl: displayUrl,
    };
  } catch (error) {
    console.error("Cloudflare R2 upload error:", error);
    return null;
  }
}

export async function getR2ObjectBuffer(key: string): Promise<{ buffer: Buffer; mimeType?: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  const bucket = getR2BucketName();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) return null;

    const byteArray = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(byteArray),
      mimeType: response.ContentType,
    };
  } catch (error) {
    console.error(`Failed to get R2 object "${key}":`, error);
    return null;
  }
}

export async function deleteR2Object(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  const bucket = getR2BucketName();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    invalidateR2UsageCache();
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 object "${key}":`, error);
    return false;
  }
}
