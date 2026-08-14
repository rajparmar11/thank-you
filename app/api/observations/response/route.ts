import { NextResponse } from "next/server";
import { create } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    create("user_submissions", {
      kind: "observation-response",
      body: String(body.response || "").slice(0, 200),
      mood: "",
      status: "new",
      sort_order: 0
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save that response." }, { status: 400 });
  }
}
