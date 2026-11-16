import { NextRequest, NextResponse } from "next/server";
import { createIssueReport, getAllIssues } from "@/lib/db/issues";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guestName,
      guestContact,
      pageUrl,
      componentOrArea,
      title,
      description,
      codeSemantics,
      deviceInfo,
    } = body;

    if (!title || !description || !title.trim() || !description.trim()) {
      return NextResponse.json(
        { error: "A title and description are required to submit an issue." },
        { status: 400 }
      );
    }

    const issue = await createIssueReport({
      guestName,
      guestContact,
      pageUrl: pageUrl || "/",
      componentOrArea: componentOrArea || "General",
      title,
      description,
      codeSemantics,
      deviceInfo,
    });

    return NextResponse.json({
      success: true,
      issue,
      message: "Issue reported successfully. The administration team has been notified!",
    });
  } catch (error: any) {
    console.error("Submit issue report error:", error);
    return NextResponse.json(
      { error: "Failed to submit issue report" },
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

    const issues = await getAllIssues();
    const openCount = issues.filter((i) => i.status === "open").length;
    const resolvedCount = issues.filter((i) => i.status === "resolved").length;

    return NextResponse.json({
      success: true,
      issues,
      stats: {
        total: issues.length,
        open: openCount,
        resolved: resolvedCount,
      },
    });
  } catch (error: any) {
    console.error("Get issues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
