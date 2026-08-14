import { NextResponse } from "next/server";
import { adminEmail, adminPassword, setAdminCookie, signSession } from "../../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.email === adminEmail() && body.password === adminPassword()) {
    await setAdminCookie(signSession(body.email));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "That login did not work." }, { status: 401 });
}
