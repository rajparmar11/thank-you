import { NextResponse } from "next/server";
import { all, columnsFor, create, remove, update, validEntity } from "../../../../lib/db";
import { isAuthed } from "../../../../lib/auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ entity: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { entity } = await params;
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!validEntity(entity)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  return NextResponse.json({ rows: all(entity), columns: columnsFor(entity) });
}

export async function POST(request: Request, { params }: Params) {
  const { entity } = await params;
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!validEntity(entity)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  const body = await request.json();
  const { id } = create(entity, sanitize(body));
  return NextResponse.json({ ok: true, id });
}

export async function PUT(request: Request, { params }: Params) {
  const { entity } = await params;
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!validEntity(entity)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  const body = await request.json();
  update(entity, Number(body.id), sanitize(body));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const { entity } = await params;
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!validEntity(entity)) return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  const body = await request.json();
  remove(entity, Number(body.id));
  return NextResponse.json({ ok: true });
}

function sanitize(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || key === "created_at" || key === "updated_at") continue;
    if (typeof value === "string") out[key] = value.trim().slice(0, 12000);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
    else if (value == null) out[key] = "";
  }
  return out;
}
