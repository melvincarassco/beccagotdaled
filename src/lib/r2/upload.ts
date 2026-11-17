import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicDomain, isR2Configured } from "./client";

export async function checkR2Connection(): Promise<{ connected: boolean; bucket: string; error?: string }> {
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
    return { connected: true, bucket };
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
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 object "${key}":`, error);
    return false;
  }
}
