import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // Format: YYYY-MM
  
  let dateCondition = "1=1";
  const params: any[] = [];
  
  if (month) {
    dateCondition = "to_char(fecha, 'YYYY-MM') = $1";
    params.push(month);
  }

  try {
    // Totals
    const { rows: totalsRows } = await sql.query(`
      SELECT 
        COUNT(*) as total_viajes,
        SUM(km) as total_km,
        AVG(km) as promedio_km
      FROM viajes
      WHERE ${dateCondition}
    `, params);
    const totals = totalsRows[0];

    // Ambulancias
    const { rows: ambulancias } = await sql.query(`
      SELECT 
        ambulancia, 
        COUNT(*) as viajes, 
        SUM(km) as km 
      FROM viajes 
      WHERE ${dateCondition}
      GROUP BY ambulancia 
      ORDER BY viajes DESC
    `, params);

    // Tripulacion (using jsonb_array_elements_text)
    const { rows: tripulacion } = await sql.query(`
      SELECT 
        jsonb_array_elements_text(tripulacion) as nombre,
        COUNT(*) as viajes,
        SUM(km) as km
      FROM viajes
      WHERE ${dateCondition}
      GROUP BY nombre
      ORDER BY viajes DESC
    `, params);

    // Top 5 rutas
    const { rows: topRutas } = await sql.query(`
      SELECT 
        origen || ' ➝ ' || destino as ruta,
        COUNT(*) as cantidad
      FROM viajes
      WHERE ${dateCondition}
      GROUP BY origen, destino
      ORDER BY cantidad DESC
      LIMIT 5
    `, params);

    return NextResponse.json({
      totals: {
        viajes: parseInt(totals.total_viajes) || 0,
        km: parseFloat(totals.total_km) || 0,
        promedio: parseFloat(totals.promedio_km) || 0
      },
      ambulancias: ambulancias.map(a => ({ ...a, viajes: parseInt(a.viajes), km: parseFloat(a.km) })),
      tripulacion: tripulacion.map(t => ({ ...t, viajes: parseInt(t.viajes), km: parseFloat(t.km) })),
      topRutas: topRutas.map(r => ({ ...r, cantidad: parseInt(r.cantidad) }))
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
