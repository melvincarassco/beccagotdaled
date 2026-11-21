import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Automated Keep-Alive endpoint for Supabase Free Tier.
 * Supabase Free projects pause after 7 days of zero database activity.
 * This route performs a lightweight query to reset the inactivity timer,
 * ensuring the project stays active indefinitely without manual intervention.
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { ok: false, error: "Database client not configured" },
        { status: 500 }
      );
    }

    // Perform lightweight read query on guests table
    const { data, error } = await adminClient
      .from("guests")
      .select("id")
      .limit(1);

    if (error) {
      console.error("[keepalive] Supabase ping query error:", error);
      return NextResponse.json(
        { ok: false, error: error.message, latencyMs: Date.now() - startTime },
        { status: 500 }
      );
    }

    const latencyMs = Date.now() - startTime;
    console.log(`[keepalive] Supabase keepalive ping succeeded in ${latencyMs}ms`);

    return NextResponse.json({
      ok: true,
      service: "supabase",
      status: "active",
      timestamp: new Date().toISOString(),
      latencyMs,
      message: "Supabase inactivity timer successfully reset. Project remains active.",
    });
  } catch (err: any) {
    console.error("[keepalive] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
