import { S3Client } from "@aws-sdk/client-s3";

let cachedR2Client: S3Client | null = null;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

export function getR2Client(): S3Client | null {
  if (cachedR2Client) return cachedR2Client;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  try {
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return cachedR2Client;
  } catch (error) {
    console.error("Failed to initialize Cloudflare R2 client:", error);
    return null;
  }
}

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME?.trim() || "beccagotdaled-photos";
}

export function getR2PublicDomain(): string | null {
  const domain = process.env.R2_PUBLIC_DOMAIN?.trim();
  if (!domain) return null;
  return domain.replace(/\/+$/, "");
}
