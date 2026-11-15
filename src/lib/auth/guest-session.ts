import { cookies } from "next/headers";
import { SessionGuest } from "@/types";

const COOKIE_NAME = "becca_guest_session";
const SESSION_SECRET = process.env.GUEST_SESSION_SECRET || "fallback-secret-key-for-beccagotdaled-wedding-2026";

/**
 * Creates an HMAC-SHA256 signature for the session payload
 */
async function signPayload(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const b64 = Buffer.from(signature).toString("base64url");
  return b64;
}

/**
 * Encodes and signs session data
 */
export async function createSessionToken(guest: SessionGuest): Promise<string> {
  const payloadStr = JSON.stringify({
    ...guest,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  const encodedPayload = Buffer.from(payloadStr).toString("base64url");
  const signature = await signPayload(encodedPayload, SESSION_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token
 */
export async function verifySessionToken(token: string): Promise<SessionGuest | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSignature = await signPayload(encodedPayload, SESSION_SECRET);

    if (signature !== expectedSignature) {
      return null;
    }

    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
      fullName: payload.fullName,
      isAdmin: Boolean(payload.isAdmin),
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves current active guest session from request cookies
 */
export async function getCurrentGuestSession(): Promise<SessionGuest | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Sets the HTTP-only secure cookie for the guest
 */
export async function setGuestSessionCookie(guest: SessionGuest): Promise<void> {
  const token = await createSessionToken(guest);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears the guest session cookie upon logout
 */
export async function clearGuestSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
