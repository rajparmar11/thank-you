import { NextResponse } from "next/server";
import { all, settings } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    settings: settings(),
    homepage_cards: all("homepage_cards"),
    timeline_entries: all("timeline_entries"),
    notes: all("notes"),
    open_when_cards: all("open_when_cards"),
    photos: all("photos"),
    songs: all("songs"),
    observations: all("observations"),
    scenarios: all("scenarios"),
    conversation_prompts: all("conversation_prompts"),
    easter_eggs: all("easter_eggs")
  });
}
