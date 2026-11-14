import { NextResponse } from "next/server";
import { getAllGuests } from "@/lib/db/guests";

export async function GET() {
  try {
    const guests = await getAllGuests();

    const headers = ["First Name", "Last Name", "PIN Code", "Status", "Date Added"];
    const rows = guests.map((g) => [
      g.first_name,
      g.last_name,
      g.pin_code || "",
      g.is_active ? "Active" : "Inactive",
      new Date(g.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="wedding_guest_register.csv"',
      },
    });
  } catch (error: any) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Failed to export guest CSV." }, { status: 500 });
  }
}
