import { NextResponse } from "next/server";
import { recordActivity } from "../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    recordActivity(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Activity could not be saved." }, { status: 400 });
  }
}
