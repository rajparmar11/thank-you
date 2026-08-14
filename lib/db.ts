import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { EntityName, Row } from "./types";

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "data/chelsi.sqlite");
let db: DatabaseSync | undefined;

const entityColumns: Record<EntityName, string[]> = {
  homepage_cards: ["title", "subtitle", "icon", "href", "featured", "sort_order"],
  timeline_entries: ["title", "entry_date", "body", "image_url", "caption", "personal_note", "song", "sort_order"],
  notes: ["category", "title", "body", "locked", "unlock_hint", "sort_order"],
  open_when_cards: ["title", "body", "lock_until", "sort_order"],
  photos: ["image_url", "category", "caption", "description", "taken_at", "favorite", "sort_order"],
  songs: ["title", "artist", "artwork_url", "audio_url", "intro", "why", "song_date", "caption", "archived", "sort_order"],
  observations: ["section", "body", "sort_order"],
  scenarios: ["title", "body", "sort_order"],
  conversation_prompts: ["category", "prompt", "sort_order"],
  conversation_messages: ["sender", "body", "sort_order"],
  user_submissions: ["kind", "body", "image_url", "song_title", "mood", "status", "sort_order"],
  easter_eggs: ["trigger", "title", "body", "unlock_requirement", "active", "sort_order"],
  activity_events: ["session_id", "event_type", "page", "metadata", "duration_seconds", "device"]
};

export const adminEntities = Object.keys(entityColumns) as EntityName[];

export function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    migrate(db);
    seed(db);
  }
  return db;
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS homepage_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, subtitle TEXT, icon TEXT, href TEXT, featured INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS timeline_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, entry_date TEXT, body TEXT, image_url TEXT, caption TEXT, personal_note TEXT, song TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, title TEXT NOT NULL, body TEXT, locked INTEGER DEFAULT 0, unlock_hint TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS open_when_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT, lock_until TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, image_url TEXT, category TEXT, caption TEXT, description TEXT, taken_at TEXT, favorite INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, artist TEXT, artwork_url TEXT, audio_url TEXT, intro TEXT, why TEXT, song_date TEXT, caption TEXT, archived INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT, body TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversation_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, prompt TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, body TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, body TEXT, image_url TEXT, song_title TEXT, mood TEXT, status TEXT DEFAULT 'new', sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS easter_eggs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, trigger TEXT, title TEXT, body TEXT, unlock_requirement INTEGER DEFAULT 0, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS activity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, event_type TEXT, page TEXT, metadata TEXT, duration_seconds INTEGER, device TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function count(database: DatabaseSync, table: EntityName | "settings") {
  return Number(database.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get()?.c || 0);
}

function insert(database: DatabaseSync, table: EntityName, data: Record<string, unknown>) {
  const cols = entityColumns[table].filter((c) => c in data);
  const values = cols.map((c) => data[c]);
  database.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).run(...(values as SQLInputValue[]));
}

function seed(database: DatabaseSync) {
  database.prepare("INSERT OR IGNORE INTO admins (email) VALUES (?)").run(process.env.ADMIN_EMAIL || "raj@example.com");
  if (!count(database, "settings")) {
    const settings = [
      ["greeting", "Hey, Chelsiiii 💗"],
      ["subheading", "You found your way back here."],
      ["rotating_messages", JSON.stringify(["Okay, you actually came back 😂", "I was wondering when you'd find this.", "There are probably things here you haven't discovered yet.", "No pressure. Just look around.", "Some things are better kept here."])],
      ["gentle_note", "Some things don't need to happen every day to still matter."]
    ];
    const stmt = database.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    settings.forEach((row) => stmt.run(...row));
  }
  if (!count(database, "homepage_cards")) [
    ["📖", "Our Story", "The things we've been through.", "/story", 0],
    ["💌", "Things I Never Said", "Things that are easier to write here.", "/never-said", 0],
    ["🗝️", "Secret Room", "There might be something hidden.", "/secret-room", 0],
    ["🎁", "Open When...", "For different versions of you.", "/open-when", 0],
    ["🎧", "If Our Situation Was a Song...", "One song that says what words can't.", "/song", 0],
    ["🫶", "You, According to Me", "Things I've noticed.", "/you", 0],
    ["🌌", "If We Could...", "Just hypothetical... maybe.", "/if-we-could", 0],
    ["💬", "Back to Us", "Maybe we can just talk normally again.", "/back-to-us", 1]
  ].forEach((x, i) => insert(database, "homepage_cards", { icon: x[0], title: x[1], subtitle: x[2], href: x[3], featured: x[4], sort_order: i }));
  if (!count(database, "timeline_entries")) [
    ["The beginning", "Somewhere at the start", "The part where ordinary conversations quietly became something I kept looking forward to.", "", "No dramatic music. Just the start.", "", 0],
    ["First conversations", "Early days", "Tiny messages, random topics, and that comfortable feeling of not needing to perform.", "", "This is where the little world began.", "", 1],
    ["Funny moments", "Whenever we forgot to be serious", "The jokes, the teasing, and the parts that probably make no sense to anyone else.", "", "Some memories are basically nonsense with meaning.", "", 2],
    ["The difficult communication period", "A real chapter", "This happened. We went through it. We're still here. No pressure, no blame, just a page that remembers gently.", "", "Whenever you're comfortable, this place is here.", "", 3],
    ["August 11, 2026", "2026-08-11", "A date with its own quiet underline. Raj can replace this with the real memory when ready.", "", "Marked, but not overexplained.", "", 4],
    ["What comes next", "Later", "Maybe nothing huge. Maybe just talking normally again. Either way, the door stays soft.", "", "Small steps count.", "", 5]
  ].forEach(([title, entry_date, body, image_url, caption, song, sort_order]) => insert(database, "timeline_entries", { title, entry_date, body, image_url, caption, song, sort_order }));
  if (!count(database, "notes")) [
    ["Something I wanted to tell you", "A small truth", "I made this so there would be a place where things could wait patiently.", 0],
    ["Something I misunderstood", "A softer version", "Sometimes silence is not distance. Sometimes it is just life being complicated.", 0],
    ["Something I was scared to say", "Locked little note", "This note can be replaced with something only Chelsi should find after a secret unlock.", 1],
    ["Something I hope you know", "No pressure", "You never have to rush back here. It still counts, even quietly.", 0]
  ].forEach((n, i) => insert(database, "notes", { category: n[0], title: n[1], body: n[2], locked: n[3], unlock_hint: "Find more stars in the Secret Room.", sort_order: i }));
  if (!count(database, "open_when_cards")) [
    ["Open when you're missing me", "Here is a tiny normal thing: I hope you drank water today. Very emotional, I know.", ""],
    ["Open when you're having a bad day", "No fixing speech. Just this: breathe, unclench your jaw, and take the day in smaller pieces.", ""],
    ["Open when you need to laugh", "Imagine me trying to act mysterious while building an entire secret website. Exactly.", ""],
    ["Open before you sleep", "Goodnight, Chelsiiii. Nothing demanding. Just a soft place to end the day.", ""]
  ].forEach((c, i) => insert(database, "open_when_cards", { title: c[0], body: c[1], lock_until: c[2], sort_order: i }));
  if (!count(database, "photos")) {
    [1, 2, 3, 4, 5].forEach((n, i) => insert(database, "photos", { image_url: `/photos-${n}.jpeg`, category: i % 2 ? "Random things" : "Favorite moments", caption: `Memory ${n}`, description: "Replace this caption in the admin panel with the real story.", favorite: i === 0 ? 1 : 0, sort_order: i }));
  }
  if (!count(database, "songs")) [
    ["The song for now", "Raj", "/photos-1.jpeg", "/song.mp3", "If I had to explain us without saying anything...\n\nI'd probably play you this.", "I don't know if this song explains everything... but somehow it says the things I don't know how to.", "2026-08-11", "Current chapter", 0],
    ["A song from another time", "Archived", "/photos-2.jpeg", "", "An older little soundtrack.", "This one belonged to a different version of us.", "", "Songs that were us at different times.", 1]
  ].forEach((s, i) => insert(database, "songs", { title: s[0], artist: s[1], artwork_url: s[2], audio_url: s[3], intro: s[4], why: s[5], song_date: s[6], caption: s[7], archived: s[8], sort_order: i }));
  if (!count(database, "observations")) [
    ["Things I noticed about you", "You have a way of making small replies feel like they have a whole expression behind them."],
    ["Things that make you laugh", "Randomly specific stupidity. Especially when nobody else would understand why it is funny."],
    ["Little habits", "The pauses, the typing rhythm, the way you say things without making them too obvious."],
    ["Things you probably don't realize I notice", "When you are careful with words because life around you is not always simple."]
  ].forEach((o, i) => insert(database, "observations", { section: o[0], body: o[1], sort_order: i }));
  if (!count(database, "scenarios")) [
    ["If we had one completely free day", "No huge plan. Food, a walk, music in the background, and zero pretending to be busy."],
    ["If we could randomly travel somewhere", "Some place with lights at night and enough quiet that conversation can wander."],
    ["If we met for the first time today", "I think I would still notice you. Annoyingly quickly, probably."],
    ["If we could disappear for a day", "Phones quiet. No explanations. Just a day that belongs to nobody else."]
  ].forEach((s, i) => insert(database, "scenarios", { title: s[0], body: s[1], sort_order: i }));
  if (!count(database, "conversation_prompts")) [
    ["Random talks", "So... what were you doing today?"],
    ["Stupid questions", "Okay, important question 👀"],
    ["Random talks", "Tell me something random."],
    ["Inside jokes", "I have something stupid to tell you 😂"],
    ["Late-night conversations", "Rate your day out of 10."],
    ["Arguments 😂", "Your turn. Start the conversation."]
  ].forEach((p, i) => insert(database, "conversation_prompts", { category: p[0], prompt: p[1], sort_order: i }));
  if (!count(database, "easter_eggs")) [
    ["Chelsiiii", "You typed the magic version", "Okay, you found one of the tiny hidden things.", 0],
    ["stars:5", "Five stars", "Okay, you weren't supposed to find this yet 😂", 5],
    ["secret-page", "Stupid secret page", "Since you're here... I still made this entire website for you.", 0]
  ].forEach((e, i) => insert(database, "easter_eggs", { trigger: e[0], title: e[1], body: e[2], unlock_requirement: e[3], active: 1, sort_order: i }));
}

export function settings() {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, safeJson(r.value)]));
}

export function all(table: EntityName) {
  return getDb().prepare(`SELECT * FROM ${table} ORDER BY sort_order ASC, id ASC`).all() as Row[];
}

export function create(table: EntityName, data: Record<string, unknown>) {
  insert(getDb(), table, data);
  return getDb().prepare("SELECT last_insert_rowid() AS id").get() as { id: number };
}

export function update(table: EntityName, id: number, data: Record<string, unknown>) {
  const cols = entityColumns[table].filter((c) => c in data);
  if (!cols.length) return;
  getDb().prepare(`UPDATE ${table} SET ${cols.map((c) => `${c}=?`).join(",")}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...(cols.map((c) => data[c]) as SQLInputValue[]), id);
}

export function remove(table: EntityName, id: number) {
  getDb().prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
}

export function recordActivity(data: Record<string, unknown>) {
  create("activity_events", {
    session_id: data.session_id || crypto.randomUUID(),
    event_type: data.event_type || "visit",
    page: data.page || "/",
    metadata: JSON.stringify(data.metadata || {}),
    duration_seconds: Number(data.duration_seconds || 0),
    device: data.device || "unknown"
  });
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function validEntity(name: string): name is EntityName {
  return Object.prototype.hasOwnProperty.call(entityColumns, name);
}

export function columnsFor(table: EntityName) {
  return entityColumns[table];
}
