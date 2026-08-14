import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "chelsi_admin_session";

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL || "raj@example.com";
}

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "change-this-private-password";
}

export function signSession(email: string) {
  const payload = JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 12 });
  const body = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token?: string) {
  if (!token || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { email: string; exp: number };
  return data.email === adminEmail() && data.exp > Date.now();
}

export async function isAuthed() {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
