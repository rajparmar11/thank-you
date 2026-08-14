"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type View = "home" | "story" | "notes" | "secrets" | "openWhen" | "gallery" | "song" | "you" | "scenarios" | "yourSide" | "back";
type Row = { id: number; [key: string]: any };
type Data = {
  settings: Record<string, any>;
  homepage_cards: Row[];
  timeline_entries: Row[];
  notes: Row[];
  open_when_cards: Row[];
  photos: Row[];
  songs: Row[];
  observations: Row[];
  scenarios: Row[];
  conversation_prompts: Row[];
  easter_eggs: Row[];
};

const viewMap: Record<string, View> = {
  "/": "home", "/story": "story", "/never-said": "notes", "/secret-room": "secrets", "/open-when": "openWhen",
  "/gallery": "gallery", "/song": "song", "/you": "you", "/if-we-could": "scenarios", "/your-side": "yourSide", "/back-to-us": "back"
};

const empty: Data = { settings: {}, homepage_cards: [], timeline_entries: [], notes: [], open_when_cards: [], photos: [], songs: [], observations: [], scenarios: [], conversation_prompts: [], easter_eggs: [] };

export default function PrivateWorld({ initialView }: { initialView: View }) {
  const [data, setData] = useState<Data>(empty);
  const [view, setView] = useState<View>(initialView);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const session = useRef("");
  const started = useRef(Date.now());

  useEffect(() => {
    session.current = localStorage.getItem("chelsi_session") || crypto.randomUUID();
    localStorage.setItem("chelsi_session", session.current);
    fetch("/api/public-data").then((r) => r.json()).then(setData).catch(() => setToast("This little corner is taking a second to open.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const path = Object.entries(viewMap).find(([, v]) => v === view)?.[0] || "/";
    history.replaceState(null, "", path);
    track("page", path);
  }, [view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const next = ((window as any).__chelsiTyped || "") + event.key;
      (window as any).__chelsiTyped = next.slice(-16);
      if ((window as any).__chelsiTyped.toLowerCase().includes("chelsiiii")) {
        setToast("You typed the magic version. Tiny secret unlocked.");
        unlock("typed-chelsiiii");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function track(event_type: string, page = location.pathname, metadata: Record<string, any> = {}) {
    const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : /Tablet|iPad/i.test(navigator.userAgent) ? "tablet" : "desktop";
    navigator.sendBeacon?.("/api/activity", JSON.stringify({ session_id: session.current, event_type, page, metadata, duration_seconds: Math.round((Date.now() - started.current) / 1000), device }));
  }

  function unlock(name: string) {
    const unlocked = new Set(JSON.parse(localStorage.getItem("chelsi_unlocks") || "[]"));
    unlocked.add(name);
    localStorage.setItem("chelsi_unlocks", JSON.stringify([...unlocked]));
  }

  const message = useMemo(() => {
    const list = data.settings.rotating_messages || [];
    const day = Math.floor(Date.now() / 86400000);
    return list.length ? list[day % list.length] : "No pressure. Just look around.";
  }, [data]);

  if (loading) return <Shell view={view} setView={setView}><div className="loading">Opening the little corner...</div></Shell>;

  return (
    <Shell view={view} setView={setView}>
      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
      {view === "home" && <Home data={data} message={message} setView={setView} />}
      {view === "story" && <Story rows={data.timeline_entries} />}
      {view === "notes" && <Notes rows={data.notes} />}
      {view === "secrets" && <SecretRoom rows={data.easter_eggs} toast={setToast} />}
      {view === "openWhen" && <OpenWhen rows={data.open_when_cards} />}
      {view === "gallery" && <Gallery rows={data.photos} />}
      {view === "song" && <Song rows={data.songs} />}
      {view === "you" && <You rows={data.observations} toast={setToast} />}
      {view === "scenarios" && <Scenarios rows={data.scenarios} />}
      {view === "yourSide" && <YourSide toast={setToast} />}
      {view === "back" && <BackToUs rows={data.conversation_prompts} />}
    </Shell>
  );
}

function Shell({ children, view, setView }: { children: React.ReactNode; view: View; setView: (v: View) => void }) {
  const nav: [View, string][] = [["home", "Home"], ["story", "Story"], ["back", "Back to Us"], ["secrets", "Secrets"], ["gallery", "More"]];
  return (
    <main className="world">
      <div className="grain" />
      <aside className="side">
        <button className="brand" onClick={() => setView("home")} aria-label="Go home"><span>Chelsiiii</span><small>made by Raj</small></button>
        <nav>{nav.map(([v, label]) => <button className={view === v ? "active" : ""} key={v} onClick={() => setView(v)}>{label}</button>)}</nav>
      </aside>
      <section className="stage">{children}</section>
      <nav className="bottom">{nav.map(([v, label]) => <button className={view === v ? "active" : ""} key={v} onClick={() => setView(v)}>{label}</button>)}</nav>
    </main>
  );
}

function Home({ data, message, setView }: { data: Data; message: string; setView: (v: View) => void }) {
  return <div className="hero page"><p className="script">private little universe</p><h1>{data.settings.greeting || "Hey, Chelsiiii 💗"}</h1><h2>{data.settings.subheading || "You found your way back here."}</h2><p className="rotating">{message}</p><button className="primary" onClick={() => setView("story")}>Enter our little corner →</button><p className="quiet">{data.settings.gentle_note}</p><h3>A little place for...</h3><div className="cardGrid">{data.homepage_cards.map((card) => <button key={card.id} className={`navCard ${card.featured ? "featured" : ""}`} onClick={() => setView(viewMap[card.href] || "home")}><span>{card.icon}</span><b>{card.title}</b><small>{card.subtitle}</small></button>)}</div></div>;
}

function Story({ rows }: { rows: Row[] }) {
  return <PageTitle title="Our Story" sub="This happened. We went through it. We're still here."><div className="timeline">{rows.map((r, i) => <article className="timelineItem" key={r.id} style={{ animationDelay: `${i * 80}ms` }}><time>{r.entry_date}</time><h3>{r.title}</h3>{r.image_url && <img src={r.image_url} alt={r.caption || r.title} />}<p>{r.body}</p>{r.caption && <small>{r.caption}</small>}{r.personal_note && <blockquote>{r.personal_note}</blockquote>}</article>)}</div></PageTitle>;
}

function Notes({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<Row | null>(null);
  return <PageTitle title="Things I Never Said" sub="Things that are easier to write here."><div className="envelopes">{rows.map((r) => <button key={r.id} className="envelope" onClick={() => setOpen(r)}><span>{r.locked ? "🔒" : "💌"}</span><small>{r.category}</small><b>{r.title}</b><em>{r.locked ? r.unlock_hint : "tap to open"}</em></button>)}</div>{open && <Modal close={() => setOpen(null)}><h2>{open.title}</h2><p className="quiet">{open.category}</p><p>{open.locked ? `Locked for now. ${open.unlock_hint || ""}` : open.body}</p></Modal>}</PageTitle>;
}

function SecretRoom({ rows, toast }: { rows: Row[]; toast: (s: string) => void }) {
  const [stars, setStars] = useState(0);
  const [open, setOpen] = useState<Row | null>(null);
  const total = Math.max(7, rows.length + 4);
  function found(i: number) { const next = Math.min(total, stars + 1); setStars(next); if (next === 5) toast("Okay, you weren't supposed to find this yet 😂"); }
  return <PageTitle title="Secret Room" sub={`Secrets discovered: ${stars} / ${total}`}><div className="room">{Array.from({ length: 7 }).map((_, i) => <button key={i} className={`star s${i}`} onClick={() => found(i)} aria-label="Hidden star">✦</button>)}<button className="hiddenNote" onClick={() => setOpen(rows[0])}>under the floorboard</button><button className="lockedCard" onClick={() => stars >= 5 ? setOpen(rows[1]) : toast("Find five hidden stars first.")}>locked memory</button><button className="secretDoor" onClick={() => setOpen(rows[2])}>?</button></div>{open && <Modal close={() => setOpen(null)}><h2>{open.title}</h2><p>{open.body}</p></Modal>}</PageTitle>;
}

function OpenWhen({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<Row | null>(null);
  const locked = (r: Row) => r.lock_until && new Date(r.lock_until) > new Date();
  return <PageTitle title="Open When..." sub="For different versions of you."><div className="envelopes">{rows.map((r) => <button key={r.id} className="envelope openWhen" onClick={() => locked(r) ? setOpen({ id: -1, title: "Not yet", body: `This one opens on ${r.lock_until}.` }) : setOpen(r)}><span>🎁</span><b>{r.title}</b><em>{locked(r) ? "date locked" : "open"}</em></button>)}</div>{open && <Modal close={() => setOpen(null)}><h2>{open.title}</h2><p>{open.body}</p></Modal>}</PageTitle>;
}

function Gallery({ rows }: { rows: Row[] }) {
  if (!rows.length) return <PageTitle title="Our Gallery" sub="The scrapbook is waiting for its first memory." />;
  return <PageTitle title="Our Gallery" sub="A scrapbook, not a grid."><div className="scrapbook">{rows.map((r, i) => <figure className="polaroid" key={r.id} style={{ rotate: `${(i % 2 ? 1 : -1) * (2 + i)}deg` }}><img src={r.image_url} alt={r.caption || "Shared memory"} /><figcaption><b>{r.caption}</b><small>{r.category}{r.favorite ? " · favorite" : ""}</small><p>{r.description}</p></figcaption></figure>)}</div></PageTitle>;
}

function Song({ rows }: { rows: Row[] }) {
  const current = rows.find((r) => !r.archived) || rows[0];
  const archived = rows.filter((r) => r.archived);
  return <PageTitle title="If Our Situation Was a Song..." sub="If I had to explain us without saying anything... I'd probably play you this.">{current ? <Player song={current} /> : <Empty text="No song has been chosen yet." />}{archived.length > 0 && <><h3>Songs that were us at different times</h3><div className="archive">{archived.map((s) => <article key={s.id}><img src={s.artwork_url} alt="" /><b>{s.title}</b><small>{s.artist} · {s.song_date}</small><p>{s.why}</p></article>)}</div></>}</PageTitle>;
}

function Player({ song }: { song: Row }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [why, setWhy] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  return <section className="player"><img src={song.artwork_url} alt={song.caption || song.title} /><div><p className="script">{song.intro}</p><h2>{song.title}</h2><p>{song.artist}</p><audio ref={audio} src={song.audio_url} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onEnded={() => setPlaying(false)} /><div className="controls"><button onClick={() => { const el = audio.current; if (!el) return; playing ? el.pause() : el.play(); setPlaying(!playing); }}>{playing ? "Pause" : "Play"}</button><input aria-label="Song progress" type="range" min="0" max={duration || 0} value={time} onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }} /><span>{fmt(time)} / {fmt(duration)}</span><input aria-label="Volume" type="range" min="0" max="1" step="0.01" defaultValue="0.8" onChange={(e) => { if (audio.current) audio.current.volume = Number(e.target.value); }} /></div><div className="visualizer" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 80}ms` }} />)}</div><button className="softBtn" onClick={() => setWhy(!why)}>Why this one?</button>{why && <blockquote>{song.why}</blockquote>}</div></section>;
}

function You({ rows, toast }: { rows: Row[]; toast: (s: string) => void }) {
  const options = ["Yep 😂", "Mostly", "Not even close", "Tell me more"];
  async function send(response: string) { await fetch("/api/observations/response", { method: "POST", body: JSON.stringify({ response }) }); toast("Saved for Raj to find later."); }
  return <PageTitle title="You, According to Me" sub="Things I've noticed."><div className="observations">{rows.map((r) => <article key={r.id}><h3>{r.section}</h3><p>{r.body}</p></article>)}</div><section className="responseBox"><h3>Did I get this right?</h3>{options.map((o) => <button key={o} onClick={() => send(o)}>{o}</button>)}</section></PageTitle>;
}

function Scenarios({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<Row | null>(null);
  return <PageTitle title="If We Could..." sub="Just hypothetical... maybe."><div className="dreams">{rows.map((r) => <button key={r.id} onClick={() => setOpen(r)}><span>🌌</span><b>{r.title}</b></button>)}</div>{open && <Modal close={() => setOpen(null)}><h2>{open.title}</h2><p>{open.body}</p></Modal>}</PageTitle>;
}

function YourSide({ toast }: { toast: (s: string) => void }) {
  const [form, setForm] = useState({ kind: "note", body: "", song_title: "", mood: "" });
  async function submit() { await fetch("/api/submissions", { method: "POST", body: JSON.stringify(form) }); setForm({ kind: "note", body: "", song_title: "", mood: "" }); toast("Left here for Raj to find later."); }
  return <PageTitle title="Your turn." sub="Leave something here for me to find later."><section className="formPanel"><select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option>note</option><option>memory</option><option>song</option><option>question</option><option>something random</option><option>current mood</option></select><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write anything. No pressure." /><input value={form.song_title} onChange={(e) => setForm({ ...form, song_title: e.target.value })} placeholder="Song, if there is one" /><input value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} placeholder="Mood, if you want" /><button className="primary" onClick={submit}>Leave it here</button></section></PageTitle>;
}

function BackToUs({ rows }: { rows: Row[] }) {
  const [chat, setChat] = useState(false);
  const [prompt, setPrompt] = useState("");
  const categories = [...new Set(rows.map((r) => r.category))];
  function randomPrompt() { const r = rows[Math.floor(Math.random() * rows.length)]; setPrompt(r?.prompt || "What are you doing right now?"); }
  return <PageTitle title="Back to Us?" sub="Maybe we can just talk like we used to. No awkwardness. No expectations. Just us. :)"><button className="primary" onClick={() => setChat(true)}>Okay, let's talk normally again →</button><button className="softBtn" onClick={randomPrompt}>I don't know what to say</button>{prompt && <p className="promptBubble">{prompt}</p>}<section className="gap"><b>It's been a while.</b><p>Wanna just pretend we were never awkward and continue? 😂</p><button onClick={() => setChat(true)}>Yeah, let's do that.</button></section>{chat && <section className="conversation"><h3>Our Normal Nonsense</h3>{categories.map((cat) => <details key={cat}><summary>{cat}</summary>{rows.filter((r) => r.category === cat).map((r) => <button key={r.id} onClick={() => setPrompt(r.prompt)}>{r.prompt}</button>)}</details>)}<textarea placeholder="A soft draft space. Send it wherever you both normally talk." /></section>}</PageTitle>;
}

function PageTitle({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) { return <div className="page"><p className="script">made for two</p><h1>{title}</h1><p className="lead">{sub}</p>{children}</div>; }
function Modal({ children, close }: { children: React.ReactNode; close: () => void }) { return <div className="modal" role="dialog" aria-modal="true"><div><button className="x" onClick={close} aria-label="Close">×</button>{children}</div></div>; }
function Empty({ text }: { text: string }) { return <p className="empty">{text}</p>; }
function fmt(s: number) { if (!Number.isFinite(s)) return "0:00"; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`; }
