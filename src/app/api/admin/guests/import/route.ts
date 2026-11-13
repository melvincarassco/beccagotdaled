import { NextRequest, NextResponse } from "next/server";
import { createGuest } from "@/lib/db/guests";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvText } = body;

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "CSV text is required." }, { status: 400 });
    }

    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header row if present
      if (i === 0 && line.toLowerCase().includes("first")) {
        continue;
      }

      // Format: FirstName, LastName, PIN (optional)
      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      const firstName = parts[0];
      const lastName = parts[1];
      const pinCode = parts[2] || null;

      if (firstName && lastName) {
        await createGuest(firstName, lastName, pinCode, true);
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      added: addedCount,
      skipped: skippedCount,
      message: `Successfully imported ${addedCount} wedding guests.`,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to process CSV import." }, { status: 500 });
  }
}
