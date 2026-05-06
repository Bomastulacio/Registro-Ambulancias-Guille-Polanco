import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await sql\`
      SELECT * FROM lugares_frecuentes 
      ORDER BY alias ASC
    \`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch lugares:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alias, direccion_completa, lat, lon } = body;

    if (!alias || !direccion_completa || !lat || !lon) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const { rows } = await sql\`
      INSERT INTO lugares_frecuentes (alias, direccion_completa, lat, lon)
      VALUES (\${alias}, \${direccion_completa}, \${lat}, \${lon})
      RETURNING id
    \`;

    return NextResponse.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error("Failed to insert lugar:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
