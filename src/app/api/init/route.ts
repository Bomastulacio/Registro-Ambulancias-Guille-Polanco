import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ success: true, message: "Database tables created successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to initialize DB" }, { status: 500 });
  }
}
