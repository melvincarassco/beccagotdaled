import { NextRequest, NextResponse } from "next/server";
import { findGuestByName } from "@/lib/db/guests";
import { setGuestSessionCookie } from "@/lib/auth/guest-session";
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

    const sessionData: SessionGuest = {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      fullName: `${guest.first_name} ${guest.last_name}`,
    };

    // Store in HTTP-only signed cookie
    await setGuestSessionCookie(sessionData);

    return NextResponse.json({
      success: true,
      guest: sessionData,
      message: `Welcome, ${sessionData.fullName}!`,
    });
  } catch (error) {
    console.error("Guest login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in. Please try again." },
      { status: 500 }
    );
  }
}
