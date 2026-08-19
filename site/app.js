let content;
let current = "home";
let secrets = Number(localStorage.getItem("chelsi_stars") || 0);

const app = document.querySelector("#app");
const navItems = [
  ["home", "Home"],
  ["story", "Story"],
  ["back", "Back to Us"],
  ["secrets", "Secrets"],
  ["gallery", "More"]
];

fetch("/content.json")
  .then((res) => res.json())
  .then((data) => {
    content = data;
    buildNav();
    const path = location.pathname.replace("/", "");
    current = path && path !== "index.html" ? routeToView(path) : "home";
    render();
  })
  .catch(() => {
    app.innerHTML = `<div class="page"><h1>Almost there.</h1><p class="lead">The content file did not load. Check that Netlify is publishing the site folder.</p></div>`;
  });

function buildNav() {
  const side = document.querySelector("#sideNav");
  const bottom = document.querySelector("#bottomNav");
  side.innerHTML = bottom.innerHTML = "";
  navItems.forEach(([view, label]) => {
    side.append(button(label, () => go(view), view));
    bottom.append(button(label, () => go(view), view));
  });
  document.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", () => go(el.dataset.view)));
}

function button(label, onClick, view) {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.nav = view;
  b.addEventListener("click", onClick);
  return b;
}

function go(view) {
  current = view;
  history.pushState(null, "", view === "home" ? "/" : `/${viewToRoute(view)}`);
  render();
}

window.addEventListener("popstate", () => {
  const path = location.pathname.replace("/", "");
  current = path ? routeToView(path) : "home";
  render();
});

window.addEventListener("keydown", (event) => {
  window.chelsiTyped = `${window.chelsiTyped || ""}${event.key}`.slice(-16);
  if (window.chelsiTyped.toLowerCase().includes("chelsiiii")) toast("You typed the magic version. Tiny secret unlocked.");
});

function render() {
  document.querySelectorAll("[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === current));
  const views = { home, story, notes, secrets: secretRoom, open: openWhen, gallery, song, you, could, your: yourSide, back };
  app.innerHTML = views[current] ? views[current]() : home();
  bind();
}

function home() {
  const m = content.settings.rotatingMessages;
  const message = m[Math.floor(Date.now() / 86400000) % m.length];
  return `<div class="hero page">
    <p class="script">private little universe</p>
    <h1>${content.settings.greeting}</h1>
    <h2>${content.settings.subheading}</h2>
    <p class="rotating">${message}</p>
    <button class="primary" data-go="story">Enter our little corner →</button>
    <p class="quiet">${content.settings.gentleNote}</p>
    <h3>A little place for...</h3>
    <div class="cardGrid">${content.cards.map(([icon, title, sub, view]) => `<button class="navCard ${view === "back" ? "featured" : ""}" data-go="${view}"><span>${icon}</span><b>${title}</b><small>${sub}</small></button>`).join("")}</div>
  </div>`;
}

function story() {
  return page("Our Story", "This happened. We went through it. We're still here.",
    `<div class="timeline">${content.story.map(([title, date, body, caption], i) => `<article class="timelineItem" style="animation-delay:${i * 80}ms"><time>${date}</time><h3>${title}</h3><p>${body}</p><small>${caption}</small></article>`).join("")}</div>`);
}

function notes() {
  return page("Things I Never Said", "Things that are easier to write here.",
    `<div class="envelopes">${content.notes.map(([cat, title, body, locked], i) => `<button class="envelope" data-modal-title="${esc(title)}" data-modal-body="${esc(locked && secrets < 5 ? "Locked for now. Find five hidden stars in the Secret Room." : body)}"><span>${locked && secrets < 5 ? "🔒" : "💌"}</span><small>${cat}</small><b>${title}</b><em>tap to open</em></button>`).join("")}</div>`);
}

function secretRoom() {
  return page("Secret Room", `Secrets discovered: ${secrets} / 7`,
    `<div class="room">
      ${Array.from({ length: 7 }, (_, i) => `<button class="star s${i}" data-star aria-label="Hidden star">✦</button>`).join("")}
      <button class="hiddenNote" data-modal-title="Under the floorboard" data-modal-body="Some things are better hidden in plain sight.">under the floorboard</button>
      <button class="lockedCard" data-locked>locked memory</button>
      <button class="secretDoor" data-modal-title="Okay, you found the stupid secret page 😂" data-modal-body="Since you're here... I still made this entire website for you.">?</button>
    </div>`);
}

function openWhen() {
  return page("Open When...", "For different versions of you.",
    `<div class="envelopes">${content.openWhen.map(([title, body]) => `<button class="envelope openWhen" data-modal-title="${esc(title)}" data-modal-body="${esc(body)}"><span>🎁</span><b>${title}</b><em>open</em></button>`).join("")}</div>`);
}

function gallery() {
  return page("Our Gallery", "A scrapbook, not a grid.",
    `<div class="scrapbook">${content.photos.map(([src, cat, cap, desc, fav], i) => `<figure class="polaroid" style="rotate:${(i % 2 ? 1 : -1) * (2 + i)}deg"><img src="${src}" alt="${esc(cap)}"><figcaption><b>${cap}</b><small>${cat}${fav ? " · favorite" : ""}</small><p>${desc}</p></figcaption></figure>`).join("")}</div>`);
}

function song() {
  const s = content.song;
  return page("If Our Situation Was a Song...", "If I had to explain us without saying anything... I'd probably play you this.",
    `<section class="player">
      <img src="${s.artwork}" alt="${esc(s.caption)}">
      <div>
        <p class="script">${s.intro}</p><h2>${s.title}</h2><p>${s.artist}</p>
        <audio id="audio" src="${s.audio}"></audio>
        <div class="controls"><button id="play">Play</button><input id="progress" aria-label="Song progress" type="range" min="0" value="0"><span id="time">0:00 / 0:00</span><input id="volume" aria-label="Volume" type="range" min="0" max="1" step="0.01" value="0.8"></div>
        <div class="visualizer" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="animation-delay:${i * 80}ms"></i>`).join("")}</div>
        <button class="softBtn" data-toggle="#why">Why this one?</button><blockquote id="why" hidden>${s.why}</blockquote>
      </div>
    </section>
    <h3>Songs that were us at different times</h3>
    <div class="archive">${content.archivedSongs.map(([title, artist, art, why]) => `<article><img src="${art}" alt=""><b>${title}</b><small>${artist}</small><p>${why}</p></article>`).join("")}</div>`);
}

function you() {
  return page("You, According to Me", "Things I've noticed.",
    `<div class="observations">${content.observations.map(([title, body]) => `<article><h3>${title}</h3><p>${body}</p></article>`).join("")}</div>
    <section class="responseBox"><h3>Did I get this right?</h3>${["Yep 😂", "Mostly", "Not even close", "Tell me more"].map((x) => `<button data-response="${x}">${x}</button>`).join("")}</section>`);
}

function could() {
  return page("If We Could...", "Just hypothetical... maybe.",
    `<div class="dreams">${content.scenarios.map(([title, body]) => `<button data-modal-title="${esc(title)}" data-modal-body="${esc(body)}"><span>🌌</span><b>${title}</b></button>`).join("")}</div>`);
}

function yourSide() {
  return page("Your turn.", "Leave something here for me to find later.",
    `<form name="chelsi-submissions" method="POST" data-netlify="true" class="formPanel">
      <input type="hidden" name="form-name" value="chelsi-submissions">
      <select name="kind"><option>note</option><option>memory</option><option>song</option><option>question</option><option>something random</option><option>current mood</option></select>
      <textarea name="message" required placeholder="Write anything. No pressure."></textarea>
      <input name="song" placeholder="Song, if there is one">
      <input name="mood" placeholder="Mood, if you want">
      <button class="primary">Leave it here</button>
    </form>`);
}

function back() {
  const cats = [...new Set(content.prompts.map((p) => p[0]))];
  return page("Back to Us?", "Maybe we can just talk like we used to. No awkwardness. No expectations. Just us. :)",
    `<button class="primary" data-chat>Okay, let's talk normally again →</button>
    <button class="softBtn" data-random>I don't know what to say</button>
    <p class="promptBubble" id="prompt" hidden></p>
    <section class="gap"><b>It's been a while.</b><p>Wanna just pretend we were never awkward and continue? 😂</p><button data-chat>Yeah, let's do that.</button></section>
    <section class="conversation" id="chat" hidden><h3>Our Normal Nonsense</h3>${cats.map((cat) => `<details><summary>${cat}</summary>${content.prompts.filter((p) => p[0] === cat).map((p) => `<button data-prompt="${esc(p[1])}">${p[1]}</button>`).join("")}</details>`).join("")}<textarea placeholder="A soft draft space. Send it wherever you both normally talk."></textarea></section>`);
}

function page(title, sub, body = "") {
  return `<div class="page"><p class="script">made for two</p><h1>${title}</h1><p class="lead">${sub}</p>${body}</div>`;
}

function bind() {
  document.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
  document.querySelectorAll("[data-modal-title]").forEach((el) => el.addEventListener("click", () => modal(el.dataset.modalTitle, el.dataset.modalBody)));
  document.querySelectorAll("[data-star]").forEach((el) => el.addEventListener("click", () => {
    secrets = Math.min(7, secrets + 1);
    localStorage.setItem("chelsi_stars", secrets);
    if (secrets === 5) toast("Okay, you weren't supposed to find this yet 😂");
    render();
  }));
  const locked = document.querySelector("[data-locked]");
  if (locked) locked.addEventListener("click", () => secrets >= 5 ? modal("Five stars", "Okay, you weren't supposed to find this yet 😂") : toast("Find five hidden stars first."));
  document.querySelectorAll("[data-toggle]").forEach((el) => el.addEventListener("click", () => {
    const target = document.querySelector(el.dataset.toggle);
    target.hidden = !target.hidden;
  }));
  document.querySelectorAll("[data-response]").forEach((el) => el.addEventListener("click", () => toast("Saved in this browser for Raj to see here later.")));
  document.querySelectorAll("[data-chat]").forEach((el) => el.addEventListener("click", () => document.querySelector("#chat").hidden = false));
  document.querySelectorAll("[data-prompt]").forEach((el) => el.addEventListener("click", () => showPrompt(el.dataset.prompt)));
  const random = document.querySelector("[data-random]");
  if (random) random.addEventListener("click", () => showPrompt(content.prompts[Math.floor(Math.random() * content.prompts.length)][1]));
  const form = document.querySelector("form[data-netlify]");
  if (form) form.addEventListener("submit", () => toast("Sending to Raj through Netlify forms."));
  bindPlayer();
}

function bindPlayer() {
  const audio = document.querySelector("#audio");
  if (!audio) return;
  const play = document.querySelector("#play");
  const progress = document.querySelector("#progress");
  const volume = document.querySelector("#volume");
  const time = document.querySelector("#time");
  play.addEventListener("click", () => audio.paused ? audio.play() : audio.pause());
  audio.addEventListener("play", () => play.textContent = "Pause");
  audio.addEventListener("pause", () => play.textContent = "Play");
  audio.addEventListener("loadedmetadata", () => progress.max = audio.duration || 0);
  audio.addEventListener("timeupdate", () => {
    progress.value = audio.currentTime;
    time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  });
  progress.addEventListener("input", () => audio.currentTime = progress.value);
  volume.addEventListener("input", () => audio.volume = volume.value);
}

function showPrompt(text) {
  const p = document.querySelector("#prompt");
  p.textContent = text;
  p.hidden = false;
}

function modal(title, body) {
  const wrap = document.createElement("div");
  wrap.className = "modal";
  wrap.innerHTML = `<div><button class="x" aria-label="Close">×</button><h2>${title}</h2><p>${body}</p></div>`;
  document.body.append(wrap);
  wrap.querySelector("button").addEventListener("click", () => wrap.remove());
}

function toast(text) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const t = document.createElement("button");
  t.className = "toast";
  t.textContent = text;
  t.addEventListener("click", () => t.remove());
  document.body.append(t);
  setTimeout(() => t.remove(), 4200);
}

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function fmt(s) {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function viewToRoute(view) {
  return { notes: "never-said", secrets: "secret-room", open: "open-when", song: "song", you: "you", could: "if-we-could", your: "your-side", back: "back-to-us" }[view] || view;
}

function routeToView(route) {
  return { "never-said": "notes", "secret-room": "secrets", "open-when": "open", "if-we-could": "could", "your-side": "your", "back-to-us": "back" }[route] || route;
}
