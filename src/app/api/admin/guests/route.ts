import { NextRequest, NextResponse } from "next/server";
import { getAllGuests, createGuest } from "@/lib/db/guests";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const guests = await getAllGuests({ query, activeOnly });
    return NextResponse.json({ guests });
  } catch (error) {
    console.error("Admin get guests error:", error);
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, pinCode, isActive } = body;

    if (!firstName || !lastName || !firstName.trim() || !lastName.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    const created = await createGuest(
      firstName.trim(),
      lastName.trim(),
      pinCode ? pinCode.trim() : null,
      isActive !== undefined ? Boolean(isActive) : true
    );

    return NextResponse.json({ success: true, guest: created }, { status: 201 });
  } catch (error) {
    console.error("Admin create guest error:", error);
    return NextResponse.json({ error: "Failed to create guest." }, { status: 500 });
  }
}
