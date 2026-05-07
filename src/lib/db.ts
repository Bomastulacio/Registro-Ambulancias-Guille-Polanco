import { sql } from "@vercel/postgres";

export interface Viaje {
  id?: number;
  fecha: string;
  ambulancia: string;
  tripulacion: string; // JSON string from API or DB
  pacientes: string;   // JSON string from API or DB
  origen: string;
  destino: string;
  origen_lat: number | null;
  origen_lon: number | null;
  destino_lat: number | null;
  destino_lon: number | null;
  km: number | null;
  tiempo_estimado_minutos: number | null;
  notas: string | null;
  created_at?: string;
}

export interface LugarFrecuente {
  id?: number;
  alias: string;
  direccion_completa: string;
  lat: number;
  lon: number;
  created_at?: string;
}

// Function to initialize tables (should be called once, e.g., via a special script or route)
export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS viajes (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        ambulancia VARCHAR(255) NOT NULL,
        tripulacion JSONB NOT NULL,
        origen VARCHAR(255) NOT NULL,
        destino VARCHAR(255) NOT NULL,
        origen_lat DOUBLE PRECISION,
        origen_lon DOUBLE PRECISION,
        destino_lat DOUBLE PRECISION,
        destino_lon DOUBLE PRECISION,
        km DECIMAL,
        tiempo_estimado_minutos INTEGER,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS lugares_frecuentes (
        id SERIAL PRIMARY KEY,
        alias VARCHAR(255) NOT NULL,
        direccion_completa TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lon DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      ALTER TABLE viajes ADD COLUMN IF NOT EXISTS pacientes JSONB DEFAULT '[]'::jsonb;
    `;

    console.log("Database tables initialized successfully.");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
}
