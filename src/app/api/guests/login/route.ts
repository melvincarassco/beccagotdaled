import { NextRequest, NextResponse } from "next/server";
import { findGuestByName } from "@/lib/db/guests";
import { setGuestSessionCookie } from "@/lib/auth/guest-session";
import { setAdminSessionCookie } from "@/lib/auth/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordLoginEvent } from "@/lib/db/analytics";
import { SessionGuest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, pinCode } = body;

    if (!firstName || !lastName || !firstName.trim() || !lastName.trim()) {
      return NextResponse.json(
        { error: "Please provide both your first name and last name." },
        { status: 400 }
      );
    }

    const guest = await findGuestByName(firstName.trim(), lastName.trim());

    if (!guest) {
      return NextResponse.json(
        {
          error:
            "We could not find your name on the wedding guest list. Please check the spelling or contact Becca & Dale.",
        },
        { status: 404 }
      );
    }

    // Check if guest is active (Requirement 4: Prevent unauthorized guest access)
    if (!guest.is_active) {
      return NextResponse.json(
        {
          error:
            "This guest invitation is currently inactive. Please speak with Becca or Dale to enable your portal access.",
        },
        { status: 403 }
      );
    }

    // Optional PIN verification check
    if (guest.pin_code && guest.pin_code.trim().length > 0) {
      if (!pinCode || pinCode.trim() !== guest.pin_code.trim()) {
        return NextResponse.json(
          {
            error: "Incorrect guest PIN code. Please verify your 4-digit code.",
            requiresPin: true,
          },
          { status: 401 }
        );
      }
    }

    // Check if this guest is designated as an administrator
    let isGuestAdmin = false;
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data: adminRow } = await adminClient
        .from("admins")
        .select("id")
        .eq("email", `guest:${guest.id}`)
        .maybeSingle();
      if (adminRow) {
        isGuestAdmin = true;
      }
    }

    const sessionData: SessionGuest = {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      fullName: `${guest.first_name} ${guest.last_name}`,
      isAdmin: isGuestAdmin,
    };

    // Store in HTTP-only signed guest cookie
    await setGuestSessionCookie(sessionData);

    // Record login analytics event asynchronously
    try {
      await recordLoginEvent({
        guestId: guest.id,
        guestName: sessionData.fullName,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    } catch (analyticsErr) {
      console.error("Failed to record login event:", analyticsErr);
    }

    // If guest is an admin, also establish admin session
    if (isGuestAdmin) {
      await setAdminSessionCookie("admin@beccagotdaled.com");
    }

    return NextResponse.json({
      success: true,
      guest: sessionData,
      isAdmin: isGuestAdmin,
      message: isGuestAdmin
        ? `Welcome, Administrator ${sessionData.fullName}!`
        : `Welcome, ${sessionData.fullName}!`,
    });
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in. Please try again." },
      { status: 500 }
    );
  }
}
