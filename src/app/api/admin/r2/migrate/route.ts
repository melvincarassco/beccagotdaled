import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-session";
import { migrateAllPhotosToR2 } from "@/lib/r2/migrate";
import { isR2Configured } from "@/lib/r2/client";
import { checkR2Connection } from "@/lib/r2/upload";

export async function POST(request: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error:
            "Cloudflare R2 is not configured. Please add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
        },
        { status: 400 }
      );
    }

    const r2Status = await checkR2Connection();
    if (!r2Status.connected) {
      return NextResponse.json(
        { error: `Cloudflare R2 connection failed: ${r2Status.error || "Cannot reach bucket"}` },
        { status: 500 }
      );
    }

    const result = await migrateAllPhotosToR2();

    return NextResponse.json({
      success: true,
      message: `Migration complete! Migrated: ${result.migrated}, Already in R2: ${result.alreadyInR2}, Failed: ${result.failed}`,
      result,
    });
  } catch (error: any) {
    console.error("R2 migration error:", error);
    return NextResponse.json({ error: error.message || "Migration failed" }, { status: 500 });
  }
}
