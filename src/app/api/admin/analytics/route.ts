import { NextResponse } from "next/server";
import { getAnalyticsData } from "@/lib/db/analytics";

export async function GET() {
  try {
    const data = await getAnalyticsData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve analytics data" },
      { status: 500 }
    );
  }
}
