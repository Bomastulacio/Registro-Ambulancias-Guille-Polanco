import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rows } = await sql`SELECT * FROM viajes WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const row = rows[0];
    return NextResponse.json({
      ...row,
      fecha: row.fecha instanceof Date ? row.fecha.toISOString().split("T")[0] : row.fecha,
      tripulacion: JSON.stringify(row.tripulacion),
      pacientes: JSON.stringify(row.pacientes ?? []),
    });
  } catch (error) {
    console.error("Failed to fetch viaje:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rowCount } = await sql`DELETE FROM viajes WHERE id = ${id}`;

    if (rowCount !== null && rowCount > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Failed to delete viaje:", error);
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
