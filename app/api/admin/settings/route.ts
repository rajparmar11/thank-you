import { NextResponse } from "next/server";
import { getDb, settings } from "../../../../lib/db";
import { isAuthed } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: settings() });
}

export async function PUT(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const db = getDb();
  const stmt = db.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP");
  for (const [key, value] of Object.entries(body)) {
    stmt.run(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  return NextResponse.json({ ok: true });
}
