import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const ambulancia = searchParams.get("ambulancia");
  const tripulante = searchParams.get("tripulante");

  try {
    let queryStr = "SELECT * FROM viajes WHERE 1=1";
    
    // We construct the query string manually or use sql fragment builder?
    // With @vercel/postgres, it's tricky to build dynamic WHERE clauses safely using the tagged template literal.
    // However, Vercel Postgres exports `db.query()` for dynamic queries, but let's just use `sql.query`
    const values: any[] = [];
    let paramIndex = 1;

    if (from) {
      queryStr += \` AND fecha >= $\${paramIndex++}\`;
      values.push(from);
    }
    if (to) {
      queryStr += \` AND fecha <= $\${paramIndex++}\`;
      values.push(to);
    }
    if (ambulancia) {
      queryStr += \` AND ambulancia ILIKE $\${paramIndex++}\`;
      values.push(\`%\${ambulancia}%\`);
    }
    if (tripulante) {
      // In Postgres, searching a JSONB array for text:
      queryStr += \` AND tripulacion::text ILIKE $\${paramIndex++}\`;
      values.push(\`%\${tripulante}%\`);
    }

    queryStr += " ORDER BY fecha DESC, created_at DESC";

    const { rows } = await sql.query(queryStr, values);
    
    // Convert date objects to strings to match frontend expectation (YYYY-MM-DD)
    const viajes = rows.map(row => ({
      ...row,
      fecha: row.fecha instanceof Date ? row.fecha.toISOString().split('T')[0] : row.fecha,
      // Stringify JSONB for compatibility with the existing frontend
      tripulacion: JSON.stringify(row.tripulacion)
    }));

    return NextResponse.json(viajes);
  } catch (error) {
    console.error("Failed to fetch viajes:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fecha,
      ambulancia,
      tripulacion,
      origen,
      destino,
      origen_lat,
      origen_lon,
      destino_lat,
      destino_lon,
      km,
      tiempo_estimado_minutos,
      notas,
    } = body;

    const { rows } = await sql\`
      INSERT INTO viajes (
        fecha, ambulancia, tripulacion, origen, destino, 
        origen_lat, origen_lon, destino_lat, destino_lon, 
        km, tiempo_estimado_minutos, notas
      ) VALUES (
        \${fecha}, \${ambulancia}, \${JSON.stringify(tripulacion)}::jsonb, \${origen}, \${destino}, 
        \${origen_lat}, \${origen_lon}, \${destino_lat}, \${destino_lon}, 
        \${km}, \${tiempo_estimado_minutos}, \${notas || null}
      )
      RETURNING id
    \`;

    return NextResponse.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error("Failed to insert viaje:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
