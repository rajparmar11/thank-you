"use client";

import { useEffect, useMemo, useState } from "react";

const entities = [
  "homepage_cards", "timeline_entries", "notes", "open_when_cards", "photos", "songs", "observations",
  "scenarios", "conversation_prompts", "conversation_messages", "user_submissions", "easter_eggs", "activity_events"
];

const names: Record<string, string> = {
  homepage_cards: "Homepage",
  timeline_entries: "Our Story",
  notes: "Private Notes",
  open_when_cards: "Open When",
  photos: "Gallery",
  songs: "Our Song",
  observations: "Chelsi",
  scenarios: "If We Could",
  conversation_prompts: "Back to Us",
  conversation_messages: "Messages",
  user_submissions: "User Contributions",
  easter_eggs: "Secret Room",
  activity_events: "Activity"
};

type Row = { id?: number; [key: string]: any };

export default function AdminApp({ authed }: { authed: boolean }) {
  const [loggedIn, setLoggedIn] = useState(authed);
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;
  return <Dashboard />;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("raj@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    if (res.ok) onLogin(); else setError("That login did not work. Check your `.env` values.");
  }
  return <main className="adminLogin"><form onSubmit={submit}><p className="script">Raj only</p><h1>Admin dashboard</h1><input value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" /><input value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" type="password" placeholder="Admin password" /><button className="primary">Sign in</button>{error && <p className="error">{error}</p>}</form></main>;
}

function Dashboard() {
  const [entity, setEntity] = useState(entities[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [editing, setEditing] = useState<Row>({});
  const [status, setStatus] = useState("");

  useEffect(() => { load(); }, [entity]);

  async function load() {
    const res = await fetch(`/api/admin/${entity}`);
    if (!res.ok) { setStatus("Could not load this section."); return; }
    const data = await res.json();
    setRows(data.rows);
    setColumns(data.columns);
    setEditing({});
  }

  async function save() {
    setStatus("Saving...");
    const method = editing.id ? "PUT" : "POST";
    const res = await fetch(`/api/admin/${entity}`, { method, body: JSON.stringify(editing) });
    setStatus(res.ok ? "Saved." : "Could not save that.");
    await load();
  }

  async function del(id?: number) {
    if (!id || !confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/${entity}`, { method: "DELETE", body: JSON.stringify({ id }) });
    setStatus(res.ok ? "Deleted." : "Could not delete that.");
    await load();
  }

  async function upload(file: File, column: string) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) setEditing({ ...editing, [column]: data.url });
    else setStatus(data.error || "Upload failed.");
  }

  const activity = entity === "activity_events";
  const title = names[entity] || entity;
  const readable = useMemo(() => columns.filter((c) => !["metadata"].includes(c)), [columns]);

  return (
    <main className="admin">
      <aside>
        <a className="brand" href="/"><span>Chelsiiii</span><small>public site</small></a>
        {entities.map((e) => <button key={e} className={entity === e ? "active" : ""} onClick={() => setEntity(e)}>{names[e]}</button>)}
        <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}>Sign out</button>
      </aside>
      <section>
        <header><div><p className="script">content system</p><h1>{title}</h1></div><button className="primary" onClick={() => setEditing({ sort_order: rows.length })}>New item</button></header>
        {status && <p className="status">{status}</p>}
        {!activity && <Editor columns={columns} row={editing} setRow={setEditing} save={save} upload={upload} />}
        {activity ? <Activity rows={rows} /> : <div className="adminRows">{rows.map((row) => <article key={row.id}><div>{readable.slice(0, 4).map((c) => <p key={c}><b>{c}</b><span>{String(row[c] ?? "")}</span></p>)}</div><footer><button onClick={() => setEditing(row)}>Edit</button><button onClick={() => del(row.id)}>Delete</button></footer></article>)}</div>}
      </section>
    </main>
  );
}

function Editor({ columns, row, setRow, save, upload }: { columns: string[]; row: Row; setRow: (r: Row) => void; save: () => void; upload: (f: File, c: string) => void }) {
  if (!columns.length) return null;
  return <form className="editor" onSubmit={(e) => { e.preventDefault(); save(); }}>
    {columns.map((c) => <label key={c}><span>{c}</span>{field(c, row[c], (v) => setRow({ ...row, [c]: v }), upload)}</label>)}
    <button className="primary">{row.id ? "Update" : "Create"}</button>
  </form>;
}

function field(column: string, value: any, set: (v: any) => void, upload: (f: File, c: string) => void) {
  if (["body", "intro", "why", "description", "personal_note", "metadata"].includes(column)) return <textarea value={value || ""} onChange={(e) => set(e.target.value)} />;
  if (column.includes("image_url") || column.includes("artwork_url") || column.includes("audio_url")) return <><input value={value || ""} onChange={(e) => set(e.target.value)} placeholder="/uploads/file.ext or URL" /><input type="file" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], column)} /></>;
  if (column.includes("date") || column === "lock_until" || column === "taken_at") return <input value={value || ""} onChange={(e) => set(e.target.value)} placeholder="YYYY-MM-DD or friendly date" />;
  if (["featured", "locked", "favorite", "archived", "active"].includes(column)) return <select value={Number(value || 0)} onChange={(e) => set(Number(e.target.value))}><option value={0}>No</option><option value={1}>Yes</option></select>;
  if (column.includes("sort_order") || column.includes("duration") || column.includes("requirement")) return <input type="number" value={Number(value || 0)} onChange={(e) => set(Number(e.target.value))} />;
  return <input value={value || ""} onChange={(e) => set(e.target.value)} />;
}

function Activity({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className="empty">No activity yet.</p>;
  return <div className="activity">{rows.slice().reverse().map((r) => <article key={r.id}><b>{r.event_type}</b><span>{r.page}</span><small>{r.device} · {r.duration_seconds || 0}s · {r.created_at}</small></article>)}</div>;
}
