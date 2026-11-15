import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ likers: [] });
    }

    // Join likes → guests to get names
    const { data, error } = await adminClient
      .from("likes")
      .select("guest_id, guests(first_name, last_name)")
      .eq("photo_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Likers fetch error:", error);
      return NextResponse.json({ likers: [] });
    }

    const likers = (data || []).map((row: any) => {
      const g = row.guests;
      if (g) {
        // Show first name + last initial only (e.g. "Sarah M.")
        const lastInitial = g.last_name ? g.last_name.charAt(0).toUpperCase() + "." : "";
        return `${g.first_name} ${lastInitial}`.trim();
      }
      return "Guest";
    });

    return NextResponse.json({ likers });
  } catch (error: any) {
    console.error("Likers API error:", error);
    return NextResponse.json({ likers: [] });
  }
}
