import { NextRequest, NextResponse } from "next/server";
import { createAccessRequest, getAllAccessRequests } from "@/lib/db/requests";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, contact, note } = body;

    if (!firstName || !lastName || !firstName.trim() || !lastName.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required to request access." },
        { status: 400 }
      );
    }

    const accessRequest = await createAccessRequest({
      firstName,
      lastName,
      contact,
      note,
    });

    return NextResponse.json({
      success: true,
      request: accessRequest,
      message: "Your request for access has been submitted! Rebecca & Dale will review it shortly.",
    });
  } catch (error: any) {
    console.error("Access request submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit access request. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await getAllAccessRequests();
    return NextResponse.json({
      success: true,
      requests,
      pendingCount: requests.filter((r) => r.status === "pending").length,
    });
  } catch (error: any) {
    console.error("Get access requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch access requests" },
      { status: 500 }
    );
  }
}
