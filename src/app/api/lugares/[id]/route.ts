import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rowCount } = await sql`DELETE FROM lugares_frecuentes WHERE id = ${id}`;

    if (rowCount > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Failed to delete lugar:", error);
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
