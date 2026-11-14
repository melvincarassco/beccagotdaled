import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "becca_admin_session";
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "becca-dale-wedding-admin-super-secret-key-2026";
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RebeccaDale2026!";

/**
 * Creates an HMAC-SHA256 signature for the admin token
 */
async function signAdminPayload(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(signature).toString("base64url");
}

/**
 * Creates signed admin session token
 */
export async function createAdminToken(email: string): Promise<string> {
  const payload = JSON.stringify({
    email,
    role: "superadmin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = await signAdminPayload(encodedPayload, ADMIN_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies admin session token
 */
export async function verifyAdminToken(token: string): Promise<{ email: string; role: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSignature = await signAdminPayload(encodedPayload, ADMIN_SECRET);

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) return null;

    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Checks if current request has an active authenticated admin session
 */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  const verified = await verifyAdminToken(token);
  return verified !== null;
}

/**
 * Sets the HTTP-only admin session cookie
 */
export async function setAdminSessionCookie(email: string): Promise<void> {
  const token = await createAdminToken(email);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clears the admin session cookie upon logout
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
