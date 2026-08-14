import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/auth";

export const runtime = "nodejs";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"]);

export async function POST(request: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, WEBP, MP3, WAV, or OGG file." }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 12 * 1024 * 1024) return NextResponse.json({ error: "Keep uploads under 12 MB." }, { status: 400 });
  const ext = extension(file.name, file.type);
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return NextResponse.json({ url: `/uploads/${filename}` });
}

function extension(name: string, type: string) {
  const existing = path.extname(name).toLowerCase();
  if (existing && existing.length <= 6) return existing;
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("wav")) return ".wav";
  if (type.includes("ogg")) return ".ogg";
  if (type.includes("audio")) return ".mp3";
  return ".jpg";
}
