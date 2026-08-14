import { NextResponse } from "next/server";
import { create } from "../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    create("user_submissions", {
      kind: clean(body.kind) || "note",
      body: clean(body.body),
      image_url: clean(body.image_url),
      song_title: clean(body.song_title),
      mood: clean(body.mood),
      status: "new",
      sort_order: 0
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save this yet." }, { status: 400 });
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 3000) : "";
}
