import { NextRequest, NextResponse } from "next/server";
import { suggestGuests } from "@/lib/db/guests";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await suggestGuests(query.trim());
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Guest suggest error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
