// Baumpflege-Quizduell — die App
//
// Drei Modi in einer Seite:
//   Teilnehmer   (Handy)    Avatar wählen, mitspielen
//   Creator      (Desktop)  Fragen, Antworten, Bilder eingeben
//   Präsentieren (Desktop)  Fragen am großen Bildschirm zeigen und weiterschalten
//
// Läuft die Seite auf localhost, spielt alles im Browser selbst (localStorage
// statt Server) — mehrere Tabs können dann gegeneinander antreten.

(function () {
  "use strict";

  const { esc } = Avatare;
  const LOKAL = ["localhost", "127.0.0.1", ""].includes(location.hostname) || location.protocol === "file:";
  const LOKAL_PW = "12345";
  const BUCHSTABEN = ["A", "B", "C", "D"];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $("#app");
  const fmt = (n) => Number(n || 0).toLocaleString("de-DE");
  // Wahl bzw. richtige Antworten als sortierte Liste (wie liste() in spiel.mjs);
  // ältere Fragen mit einer einzelnen Zahl werden so ebenfalls verstanden
  const liste = (v) => [...new Set((Array.isArray(v) ? v : v == null ? [] : [v]).filter((x) => [0, 1, 2, 3].includes(x)))].sort();

  function lade(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } }
  function speichere(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* egal */ } }
  function pw() { try { return sessionStorage.getItem("quiz-pw") || ""; } catch { return ""; } }
  function setzePw(v) { try { v ? sessionStorage.setItem("quiz-pw", v) : sessionStorage.removeItem("quiz-pw"); } catch { /* egal */ } }
  // Lokal soll jeder Tab ein eigener Mitspieler sein, daher dort sessionStorage
  const ichAblage = () => (LOKAL ? sessionStorage : localStorage);
  function ichLaden() { try { return JSON.parse(ichAblage().getItem("quiz-ich") || "null"); } catch { return null; } }
  function ichSpeichern(v) { try { v == null ? ichAblage().removeItem("quiz-ich") : ichAblage().setItem("quiz-ich", JSON.stringify(v)); } catch { /* egal */ } }

  /* ---------- Symbole ---------- */
  const ICON = {
    handy: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3" fill="#fff"/><path d="M10 18h4"/></svg>',
    stift: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z" fill="#fff"/><path d="M14 6l3 3"/></svg>',
    bildschirm: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2" fill="#fff"/><path d="M8 21h8M12 17v4"/></svg>',
    tonAn: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#ffd23f"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>',
    tonAus: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#ddd"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    haus: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" fill="#fff"/></svg>',
    vollbild: '<svg viewBox="0 0 24 24" fill="none" stroke="#2b1d14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    menue: '<svg viewBox="0 0 24 24" fill="#2b1d14"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>',
    schloss: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'
  };
  // Antwortmarken: Ahornblatt, Eichel, Pilz, Tanne — Farbe und Form unterscheiden sich
  const MARKE = [
    '<svg viewBox="0 0 24 24"><path d="M12 1.5l1.7 4.6 2.8-1.6-.8 4.4 4.4-1.6-1.6 4 4 1.2-4.8 2.8 1.2 3-5.2-1.2-.9 4.4h-1.6l-.9-4.4-5.2 1.2 1.2-3L1.5 12.5l4-1.2-1.6-4 4.4 1.6-.8-4.4 2.8 1.6z" fill="#ef476f" stroke="#2b1d14" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M6.5 11 Q6 20 12 22.5 Q18 20 17.5 11z" fill="#1e88e5" stroke="#2b1d14" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.5 11.5 Q4.5 5 12 5 Q19.5 5 19.5 11.5 Q12 13 4.5 11.5z" fill="#8a5a2b" stroke="#2b1d14" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 5V2" stroke="#2b1d14" stroke-width="1.8" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M9 13 L8 21.5 Q12 23 16 21.5 L15 13z" fill="#fff4e0" stroke="#2b1d14" stroke-width="1.3" stroke-linejoin="round"/><path d="M2 13.5 Q3 3 12 3 Q21 3 22 13.5 Q12 15.5 2 13.5z" fill="#f4a300" stroke="#2b1d14" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="8.5" r="1.4" fill="#fff"/><circle cx="14.5" cy="6.5" r="1.2" fill="#fff"/><circle cx="16.5" cy="10.5" r="1.4" fill="#fff"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 1.5 L17 8 H14.5 L19 14 H15.5 L20.5 20 H3.5 L8.5 14 H5 L9.5 8 H7z" fill="#2f9e44" stroke="#2b1d14" stroke-width="1.3" stroke-linejoin="round"/><rect x="10.5" y="20" width="3" height="3" fill="#6b4226" stroke="#2b1d14" stroke-width="1"/></svg>'
  ];

  /* ---------- Kleinigkeiten ---------- */
  let toastTimer = null;
  function toast(text, ms = 2600) {
    const t = $("#toast");
    t.textContent = text;
    t.classList.add("zeigen");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("zeigen"), ms);
  }

  function dialog(inhalt, beiOeffnen) {
    const d = $("#dialog");
    d.innerHTML = `<div class="karte" role="dialog" aria-modal="true">${inhalt}</div>`;
    d.hidden = false;
    const zu = () => { d.hidden = true; d.innerHTML = ""; document.removeEventListener("keydown", esc_); };
    const esc_ = (e) => { if (e.key === "Escape") zu(); };
    document.addEventListener("keydown", esc_);
    d.onclick = (e) => { if (e.target === d) zu(); };
    beiOeffnen && beiOeffnen($(".karte", d), zu);
    return zu;
  }

  function fragen(titel, text, jaText, jaKlasse = "rot") {
    return new Promise((ok) => {
      dialog(`<h2>${esc(titel)}</h2><p style="margin:0;font-weight:600">${esc(text)}</p>
        <div class="zeile"><button class="knopf weiss" data-nein>Abbrechen</button><button class="knopf ${jaKlasse}" data-ja>${esc(jaText)}</button></div>`,
      (k, zu) => {
        $("[data-ja]", k).onclick = () => { zu(); ok(true); };
        $("[data-nein]", k).onclick = () => { zu(); ok(false); };
        $("[data-ja]", k).focus();
      });
    });
  }

  // Fallendes Laub im Hintergrund
  (function laub() {
    const farben = ["#2f9e44", "#7cb342", "#ff8f00", "#f4a300", "#e65100", "#c0392b"];
    let s = "";
    for (let i = 0; i < 9; i++) {
      const f = farben[i % farben.length];
      s += `<span style="left:${(i * 11 + Math.random() * 6).toFixed(1)}%;animation-duration:${(11 + Math.random() * 9).toFixed(1)}s;animation-delay:-${(Math.random() * 16).toFixed(1)}s">
        <svg viewBox="0 0 24 24"><path d="M12 2 C20 6 21 15 12 22 C3 15 4 6 12 2Z" fill="${f}" stroke="#2b1d14" stroke-width="1.2"/><path d="M12 5 V21" stroke="#2b1d14" stroke-width="1" opacity=".5"/></svg></span>`;
    }
    $(".blaetter").innerHTML = s;
  })();

  // Konfetti aus Papierschnipseln und Blättern
  let konfettiLauf = null;
  function konfetti(dauer = 3000, menge = 160) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("#konfetti");
    const g = c.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const farben = ["#ffd23f", "#ef476f", "#1e88e5", "#2f9e44", "#ff7a1a", "#7ed957"];
    const teile = Array.from({ length: menge }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
      vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 3,
      w: 6 + Math.random() * 8, h: 4 + Math.random() * 6,
      r: Math.random() * 6, vr: -0.2 + Math.random() * 0.4,
      f: farben[(Math.random() * farben.length) | 0], blatt: Math.random() < 0.3
    }));
    const ende = performance.now() + dauer;
    cancelAnimationFrame(konfettiLauf);
    const schritt = (t) => {
      g.clearRect(0, 0, innerWidth, innerHeight);
      let lebt = false;
      for (const p of teile) {
        p.x += p.vx + Math.sin((t / 400) + p.r) * 0.6; p.y += p.vy; p.r += p.vr;
        if (p.y > innerHeight + 20) { if (t < ende) { p.y = -20; p.x = Math.random() * innerWidth; } else continue; }
        lebt = true;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.f;
        if (p.blatt) { g.beginPath(); g.ellipse(0, 0, p.w * 0.9, p.w * 0.45, 0, 0, Math.PI * 2); g.fill(); }
        else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g.restore();
      }
      if (lebt) konfettiLauf = requestAnimationFrame(schritt);
      else g.clearRect(0, 0, innerWidth, innerHeight);
    };
    konfettiLauf = requestAnimationFrame(schritt);
  }

  /* ---------- Uhr: Serverzeit ---------- */
  let versatz = 0, besteLaufzeit = Infinity;
  const jetzt = () => Date.now() + versatz;
  function zeitAbgleich(t0, t1, server) {
    if (!server || LOKAL) return;
    const lauf = t1 - t0;
    // Die schnellste Antwort der letzten Zeit ist die genaueste
    besteLaufzeit = Math.min(besteLaufzeit * 1.02, lauf);
    if (lauf <= besteLaufzeit * 1.05) versatz = server - (t0 + t1) / 2;
  }

  /* ---------- Verbindung ---------- */
  let spielModul = null;
  const lokalSpeicher = {
    get: async (k) => lade("qd:" + k),
    set: async (k, v) => {
      try { localStorage.setItem("qd:" + k, JSON.stringify(v)); }
      catch { throw Object.assign(new Error("Lokaler Speicher voll"), { code: "voll" }); }
    },
    del: async (k) => speichere("qd:" + k, null)
  };

  let verbindungsfehler = 0;
  async function api(methode, pfad, body) {
    const t0 = Date.now();
    if (LOKAL) {
      spielModul = spielModul || (await import("./spiel.mjs"));
      const [p, qs] = pfad.split("?");
      const r = await spielModul.bearbeite(lokalSpeicher, {
        methode, pfad: p, query: Object.fromEntries(new URLSearchParams(qs || "")), body, admin: pw() === LOKAL_PW
      });
      if (r.status >= 400) throw Object.assign(new Error(r.data.fehler), { code: r.data.fehler, status: r.status });
      return r.data;
    }
    let res;
    try {
      res = await fetch("/api/" + pfad, {
        method: methode,
        headers: { "Content-Type": "application/json", "x-quiz": "1", "x-passwort": pw() },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store"
      });
    } catch (e) {
      verbindungsfehler++;
      if (verbindungsfehler === 3) toast("Keine Verbindung — ich versuche es weiter …");
      throw Object.assign(new Error("netz"), { code: "netz" });
    }
    const t1 = Date.now();
    let data = null;
    try { data = await res.json(); } catch { /* leer */ }
    if (!res.ok) throw Object.assign(new Error(data?.fehler || "fehler"), { code: data?.fehler || "fehler", status: res.status });
    if (verbindungsfehler >= 3) toast("Wieder verbunden");
    verbindungsfehler = 0;
    zeitAbgleich(t0, t1, data?.jetzt);
    return data;
  }

  function bildUrl(id) {
    if (!id) return "";
    if (LOKAL) return lade("qd:bild/" + id)?.d || "";
    return "/api/bild/" + encodeURIComponent(id);
  }

  // Wiederholt fn im Takt, bis die Ansicht wechselt
  let stopp = null;
  function schleife(fn, ms) {
    let aktiv = true, t = null;
    const lauf = async () => {
      if (!aktiv) return;
      try { await fn(); } catch (e) { if (e.code !== "netz") console.warn(e); }
      if (aktiv) t = setTimeout(lauf, document.hidden ? ms * 3 : ms);
    };
    lauf();
    return () => { aktiv = false; clearTimeout(t); };
  }

  // Ein gemeinsamer Bildtakt für Zeitbalken und Uhr
  let takt = null;
  (function rahmen() { try { takt && takt(); } catch (e) { console.warn(e); } requestAnimationFrame(rahmen); })();

  function wechsle(modus, hash) {
    stopp && stopp(); stopp = null; takt = null;
    document.onkeydown = null;
    document.body.dataset.modus = modus;
    if (hash != null && location.hash !== "#" + hash) history.replaceState(null, "", hash ? "#" + hash : location.pathname);
    scrollTo(0, 0);
  }

  document.addEventListener("pointerdown", () => Ton.wecken(), { passive: true });

  function tonKnopf() {
    return `<button class="rundknopf" data-ton aria-label="Ton an/aus" title="Ton an/aus">${Ton.an ? ICON.tonAn : ICON.tonAus}</button>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ton]");
    if (!b) return;
    const an = Ton.umschalten();
    $$("[data-ton]").forEach((x) => (x.innerHTML = an ? ICON.tonAn : ICON.tonAus));
  });

  /* =========================================================
     Startseite
     ========================================================= */
  function startseite() {
    wechsle("start", "");
    app.innerHTML = `<div class="start"><div class="start-innen">
      <div class="logo">
        <div class="logo-avatare">
          ${Avatare.html(0, { name: "Kletter-Karl", stimmung: "froh" })}
          ${Avatare.html(6, { name: "Moritz", stimmung: "jubel" })}
          ${Avatare.html(2, { name: "Nussi", stimmung: "froh" })}
        </div>
        <h1>Baumpflege-<br><span class="gelb">Quizduell</span></h1>
        <p>Wer kennt sich am besten aus mit Ast, Krone und Kletterseil?</p>
      </div>
      <div class="rollen">
        <button class="rolle r1" data-rolle="teilnehmer">
          <span class="ikon">${ICON.handy}</span><h2>Teilnehmer</h2><p>Avatar wählen und mit dem Handy mitraten</p>
        </button>
        <button class="rolle r2" data-rolle="creator">
          <span class="ikon">${ICON.stift}</span><h2>Creator</h2><p>Fragen, Antworten und Bilder eingeben</p>
          <span class="schloss">${ICON.schloss} mit Passwort</span>
        </button>
        <button class="rolle r3" data-rolle="praesentieren">
          <span class="ikon">${ICON.bildschirm}</span><h2>Präsentieren</h2><p>Das Quiz auf dem großen Bildschirm zeigen</p>
          <span class="schloss">${ICON.schloss} mit Passwort</span>
        </button>
      </div>
    </div></div>`;
    $$("[data-rolle]").forEach((b) => (b.onclick = () => { Ton.klick(); gehe(b.dataset.rolle); }));
  }

  function gehe(rolle) {
    if (rolle === "teilnehmer") return teilnehmer();
    if (rolle === "creator" || rolle === "praesentieren") {
      const ziel = rolle === "creator" ? creator : praesentieren;
      if (pw()) return ziel();
      return passwortDialog(ziel);
    }
    startseite();
  }

  function passwortDialog(ziel) {
    dialog(`<h2>Passwort, bitte</h2>
      <form id="pw-form" class="feld" autocomplete="off">
        <span>Passwort</span>
        <input id="pw-eingabe" class="eingabe" type="password" inputmode="numeric" autocomplete="current-password" required>
      </form>
      <div class="zeile"><button class="knopf weiss" data-nein>Abbrechen</button><button class="knopf gruen" data-ja>Weiter</button></div>`,
    (k, zu) => {
      const ein = $("#pw-eingabe", k);
      ein.focus();
      const pruefen = async (e) => {
        e && e.preventDefault();
        const versuch = ein.value.trim();
        setzePw(versuch);
        try {
          await api("GET", "pruefen");
          zu(); Ton.richtig(); ziel();
        } catch (err) {
          setzePw("");
          k.classList.remove("wackeln"); void k.offsetWidth; k.classList.add("wackeln");
          Ton.falsch();
          ein.select();
          toast(err.code === "passwort" ? "Falsches Passwort" : "Keine Verbindung zum Server");
        }
      };
      $("#pw-form", k).onsubmit = pruefen;
      $("[data-ja]", k).onclick = pruefen;
      $("[data-nein]", k).onclick = zu;
    });
  }

  /* =========================================================
     Teilnehmer (Handy)
     ========================================================= */
  const T = { profil: null, ich: null, z: null, key: "", auswahl: {}, gespielt: {}, gesperrtSeit: null };

  function teilnehmer() {
    wechsle("teilnehmer", "mitspielen");
    T.profil = lade("quiz-profil") || { name: "", avatar: Math.floor(Math.random() * Avatare.anzahl) };
    T.ich = ichLaden();
    T.key = "";
    T.z = null;
    if (!T.ich) zeigeAuswahl();
    else app.innerHTML = `<div class="handy"><div class="warten-blatt" style="margin-top:40vh"><i></i><i></i><i></i></div></div>`;
    stopp = schleife(teilnehmerAbfrage, 1000);
  }

  async function teilnehmerAbfrage() {
    const q = T.ich
      ? `zustand?gid=${encodeURIComponent(T.ich.gid)}&slot=${T.ich.slot}&token=${encodeURIComponent(T.ich.token)}`
      : "zustand";
    const z = await api("GET", q);
    T.z = z;
    if (T.ich && (z.gid !== T.ich.gid || z.ich?.unbekannt)) {
      // Ein neues Spiel wurde gestartet — zurück zur Anmeldung, Avatar und Name bleiben
      T.ich = null;
      ichSpeichern(null);
      zeigeAuswahl();
      return;
    }
    if (!T.ich) { auswahlStatus(); return; }
    teilnehmerZeichnen();
  }

  function handyKopf(rechtsExtra = "") {
    return `<div class="handy-kopf">
      <span class="titel">Quizduell</span>
      <div class="rechts">${rechtsExtra}${tonKnopf()}<button class="rundknopf" data-heim aria-label="Startseite">${ICON.haus}</button></div>
    </div>`;
  }
  app.addEventListener("click", (e) => {
    if (e.target.closest("[data-heim]")) { Ton.klick(); startseite(); }
  });

  function zeigeAuswahl() {
    T.key = "auswahl";
    const p = T.profil;
    app.innerHTML = `<div class="handy">
      ${handyKopf()}
      <div class="vorschau" id="vorschau">${Avatare.html(p.avatar, { name: p.name || "Dein Name", stimmung: "froh" })}</div>
      <h2 style="font-size:1.3rem">Wähle deinen Avatar</h2>
      <div class="auswahl" role="group" aria-label="Avatare">
        ${Avatare.liste.map((a, i) => `<button type="button" data-ava="${i}" aria-pressed="${i === p.avatar}" aria-label="${esc(a.name)}">${Avatare.svg(i, "ruhig")}<small>${esc(a.name)}</small></button>`).join("")}
      </div>
      <form class="karte anmelden" id="anmelden">
        <label class="feld"><span>Dein Name</span>
          <input id="name" class="eingabe" maxlength="16" autocomplete="nickname" enterkeyhint="go" value="${esc(p.name)}" placeholder="z. B. Astgabel-Anna" required>
        </label>
        <button class="knopf gruen riesig" id="los" type="submit">Mitspielen</button>
        <div class="status-zeile"><span class="pille" id="spielstatus">Verbinde …</span></div>
      </form>
    </div>`;
    const vorschau = () => {
      $("#vorschau").innerHTML = Avatare.html(T.profil.avatar, { name: T.profil.name || "Dein Name", stimmung: "froh" });
    };
    $$("[data-ava]").forEach((b) => (b.onclick = () => {
      T.profil.avatar = +b.dataset.ava;
      $$("[data-ava]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      Ton.plopp();
      vorschau();
      speichere("quiz-profil", T.profil);
    }));
    $("#name").oninput = (e) => {
      T.profil.name = e.target.value.slice(0, 16);
      $("#vorschau .ava-name").textContent = T.profil.name || "Dein Name";
      speichere("quiz-profil", T.profil);
    };
    $("#anmelden").onsubmit = async (e) => {
      e.preventDefault();
      const name = T.profil.name.trim();
      if (!name) { $("#name").focus(); toast("Bitte gib deinen Namen ein"); return; }
      const knopf = $("#los");
      knopf.disabled = true; knopf.textContent = "Einen Moment …";
      try {
        const r = await api("POST", "beitreten", { name, avatar: T.profil.avatar });
        T.ich = { ...r, name, avatar: T.profil.avatar };
        ichSpeichern(T.ich);
        Ton.zwitschern();
        T.key = "";
        await teilnehmerAbfrage();
      } catch (err) {
        knopf.disabled = false; knopf.textContent = "Mitspielen";
        const texte = {
          kein_spiel: "Gerade läuft kein Spiel. Warte, bis der Spielleiter eins startet.",
          spiel_vorbei: "Dieses Spiel ist schon vorbei.",
          voll: "Das Spiel ist voll.",
          netz: "Keine Verbindung. Prüfe dein Internet."
        };
        toast(texte[err.code] || "Das hat nicht geklappt. Versuch es nochmal.");
      }
    };
    auswahlStatus();
  }

  function auswahlStatus() {
    const el = $("#spielstatus");
    if (!el || !T.z) return;
    const ph = T.z.phase;
    if (!T.z.gid || ph === "leer") { el.className = "pille gelb"; el.textContent = "Warte auf den Spielleiter …"; }
    else if (ph === "finale") { el.className = "pille gelb"; el.textContent = "Das Spiel ist gerade vorbei"; }
    else if (ph === "lobby") { el.className = "pille gruen"; el.textContent = "Spiel ist offen — komm rein!"; }
    else { el.className = "pille gruen"; el.textContent = `Läuft schon (Frage ${T.z.nr + 1}) — du kannst noch einsteigen`; }
  }

  function aktuelleWahl() {
    const z = T.z;
    const lokal = T.auswahl[z.gid + "/" + z.nr];
    const w = liste(lokal != null ? lokal : z.ich?.wahl);
    return w.length ? w : null;
  }

  function teilnehmerZeichnen() {
    const z = T.z, ich = z.ich || {};
    const key = [z.phase, z.gid, z.nr, aktuelleWahl(), ich.platz, ich.punkte, !!ich.entfernt].join("|");
    if (key === T.key) return;
    T.key = key;
    takt = null;

    if (ich.entfernt) {
      app.innerHTML = `<div class="handy">${handyKopf()}
        <div class="karte buehne-handy">${Avatare.html(T.ich.avatar, { name: T.ich.name, stimmung: "traurig" })}
          <h2>Du bist nicht mehr dabei</h2><p>Der Spielleiter hat dich aus dem Spiel genommen.</p>
          <button class="knopf gruen" id="neu">Neu anmelden</button></div></div>`;
      $("#neu").onclick = () => { T.ich = null; ichSpeichern(null); zeigeAuswahl(); };
      return;
    }

    const name = T.ich.name, ava = T.ich.avatar;
    const punktePille = `<span class="pille">${fmt(ich.punkte)} P</span>`;

    if (z.phase === "leer") {
      app.innerHTML = `<div class="handy">${handyKopf()}
        <div class="karte buehne-handy">${Avatare.html(ava, { name, stimmung: "froh" })}
          <h2>Das Spiel ist beendet</h2><p>Danke fürs Mitspielen! Sobald ein neues Spiel startet, kannst du wieder einsteigen.</p></div></div>`;
      return;
    }

    if (z.phase === "lobby") {
      app.innerHTML = `<div class="handy">${handyKopf()}
        <div class="karte buehne-handy">${Avatare.html(ava, { name, stimmung: "froh" })}
          <h2>Du bist dabei!</h2>
          <p>Schau auf den großen Bildschirm. Gleich geht's los.</p>
          <div class="warten-blatt"><i></i><i></i><i></i></div></div></div>`;
      return;
    }

    const kopf = handyKopf(punktePille);
    const nr = `<div class="nr">Frage ${z.nr + 1} von ${z.anzahl}</div>`;
    const bild = z.frage?.bild ? `<img src="${esc(bildUrl(z.frage.bild))}" alt="">` : "";

    if (z.phase === "frage") {
      if (T.gespielt["f" + z.gid + z.nr] !== true) { T.gespielt["f" + z.gid + z.nr] = true; Ton.rauschen(); }
      app.innerHTML = `<div class="handy">${kopf}
        <div class="karte frage-handy">${nr}<div class="text">${esc(z.frage?.text)}</div>${bild}</div>
        <div class="karte buehne-handy" style="--g:110px">${Avatare.html(ava, { name, groesse: "110px" })}
          <p>Lies die Frage — gleich kommen die Antworten.</p><div class="warten-blatt"><i></i><i></i><i></i></div></div></div>`;
      return;
    }

    if (z.phase === "antworten") {
      const wahl = aktuelleWahl();
      if (T.gespielt["a" + z.gid + z.nr] !== true) { T.gespielt["a" + z.gid + z.nr] = true; Ton.auftritt(); }
      // Kein Zeitlimit: Die Antwort lässt sich ändern, bis aufgelöst wird
      const knoepfe = (z.frage?.antworten || []).map((t, i) => t && t.trim()
        ? `<button class="antwort a${i + 1}${wahl && wahl.includes(i) ? " gewaehlt" : ""}" data-wahl="${i}" aria-pressed="${!!(wahl && wahl.includes(i))}">
            <span class="marke">${MARKE[i]}<b>${BUCHSTABEN[i]}</b></span><span>${esc(t)}</span></button>` : "").join("");
      const mehrfach = !!z.frage?.mehrfach;
      let hinweis;
      if (mehrfach) hinweis = wahl != null ? `${wahl.length} gewählt — tippe nochmal, um eine Antwort abzuwählen.` : "Tippe alle richtigen Antworten an";
      else hinweis = wahl != null ? "Gewählt! Bis zur Auflösung kannst du noch wechseln." : "Tippe auf deine Antwort";
      app.innerHTML = `<div class="handy">${kopf}
        <div class="karte frage-handy">${nr}<div class="text" style="font-size:1.1rem">${esc(z.frage?.text)}</div>
          ${mehrfach ? '<span class="pille gelb mehrfach">Mehrere Antworten richtig</span>' : ""}</div>
        <div class="antworten-handy${wahl != null ? " gewaehlt" : ""}">${knoepfe}</div>
        <div class="hinweis">${hinweis}</div></div>`;
      $$("[data-wahl]").forEach((b) => (b.onclick = () => waehle(+b.dataset.wahl)));
      return;
    }

    if (z.phase === "aufloesung") {
      const l = ich.letzte || { c: null, p: 0 };
      const richtig = l.p > 0;
      const oben = ich.platz && ich.platz <= 3 && ich.punkte > 0 ? ich.platz : null;
      const stimmung = richtig ? (oben ? "jubel" : "froh") : "traurig";
      const k = "r" + z.gid + z.nr;
      if (!T.gespielt[k]) {
        T.gespielt[k] = true;
        if (richtig) { Ton.richtig(); konfetti(1200, 70); } else Ton.falsch();
        if (navigator.vibrate) try { navigator.vibrate(richtig ? [40, 40, 40] : 200); } catch { /* egal */ }
      }
      const f = z.frage || {};
      const ri = liste(f.richtig);
      const loesungText = ri.length > 1
        ? `Richtig sind ${ri.map((i) => `${BUCHSTABEN[i]}: ${esc(f.antworten?.[i])}`).join(" · ")}`
        : `Richtig ist ${BUCHSTABEN[ri[0]]}: ${esc(f.antworten?.[ri[0]])}`;
      app.innerHTML = `<div class="handy">${kopf}
        <div class="karte ergebnis-handy">
          ${Avatare.html(ava, { name, stimmung, platz: oben })}
          <div class="gross ${richtig ? "gut" : "schlecht"}">${richtig ? "Richtig!" : l.c == null ? "Keine Antwort" : "Leider falsch"}</div>
          ${richtig ? `<div class="pille gruen">+${fmt(l.p)} Punkte</div>` : ""}
          <div class="zahlen"><span class="pille">Platz ${ich.platz || "–"} von ${ich.von || "–"}</span><span class="pille gelb">${fmt(ich.punkte)} Punkte</span></div>
        </div>
        <div class="karte loesung">
          <b>${loesungText}</b>
          ${f.erkl ? `<p>${esc(f.erkl)}</p>` : ""}
          ${f.erklBild ? `<img src="${esc(bildUrl(f.erklBild))}" alt="">` : ""}
        </div></div>`;
      return;
    }

    if (z.phase === "finale") {
      const oben = ich.platz && ich.platz <= 3 && ich.punkte > 0 ? ich.platz : null;
      const k = "fin" + z.gid;
      if (!T.gespielt[k]) {
        T.gespielt[k] = true;
        // Die Siegerehrung am Bildschirm braucht ein paar Sekunden — das Handy wartet mit
        setTimeout(() => { if (oben) { Ton.fanfare(); konfetti(5000); } else Ton.richtig(); }, 1500);
      }
      app.innerHTML = `<div class="handy">${handyKopf()}
        <div class="karte ergebnis-handy">
          ${Avatare.html(ava, { name, stimmung: oben ? "jubel" : "froh", platz: oben })}
          <div class="gross gut">${oben ? `Platz ${oben}!` : `Platz ${ich.platz || "–"}`}</div>
          <p style="margin:0;font-weight:700">${oben ? "Du stehst auf dem Treppchen — Glückwunsch!" : `von ${ich.von} — gut gekämpft!`}</p>
          <div class="pille gelb">${fmt(ich.punkte)} Punkte</div>
        </div></div>`;
    }
  }

  async function waehle(i) {
    const z = T.z;
    if (z.phase !== "antworten") return;
    const k = z.gid + "/" + z.nr;
    const vorher = aktuelleWahl() || [];
    let neu;
    if (z.frage?.mehrfach) {
      // Mehrere richtige Antworten: Antippen wählt an oder wieder ab
      neu = vorher.includes(i) ? vorher.filter((x) => x !== i) : liste([...vorher, i]);
    } else {
      if (vorher.length === 1 && vorher[0] === i) return;
      neu = [i];
    }
    T.auswahl[k] = neu;
    Ton.plopp();
    if (navigator.vibrate) try { navigator.vibrate(25); } catch { /* egal */ }
    teilnehmerZeichnen();
    // Nacheinander senden, damit bei schnellem Tippen die letzte Wahl gewinnt
    T.senden = (T.senden || Promise.resolve()).then(async () => {
      try {
        await api("POST", "antwort", { gid: z.gid, slot: T.ich.slot, token: T.ich.token, nr: z.nr, wahl: T.auswahl[k] });
      } catch (err) {
        // Zurück auf den Stand des Servers
        T.auswahl[k] = undefined;
        toast(err.code === "keine_frage" ? "Zu spät — die Frage ist schon aufgelöst" : "Antwort nicht angekommen — tippe nochmal");
        T.key = "";
        teilnehmerZeichnen();
      }
    });
  }

  /* =========================================================
     Präsentiermodus (Bildschirm)
     ========================================================= */
  const P = { d: null, key: "", bekannte: null, sek: null, quizInfo: null, sendet: false, finaleTimer: [] };

  function praesentieren() {
    wechsle("praes", "praesentieren");
    P.key = ""; P.bekannte = null; P.d = null;
    app.innerHTML = `<div class="praes">
      <header class="praes-kopf">
        <span class="titel" id="p-titel">Baumpflege-Quizduell</span>
        <span id="p-nr"></span>
        <span class="platz"></span>
        <span class="pille" id="p-anz" hidden></span>
        ${tonKnopf()}
        <button class="rundknopf" id="p-vollbild" aria-label="Vollbild" title="Vollbild">${ICON.vollbild}</button>
        <button class="rundknopf" id="p-menue" aria-label="Menü" title="Menü">${ICON.menue}</button>
      </header>
      <section class="praes-mitte" id="mitte"></section>
      <footer class="praes-fuss" id="fuss"></footer>
    </div>`;
    $("#p-vollbild").onclick = () => {
      try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch { /* egal */ }
    };
    $("#p-menue").onclick = praesMenue;
    // Leertaste, Enter, Pfeil rechts und die Bild-ab-Taste eines Präsenters schalten weiter
    document.onkeydown = (e) => {
      if (!$("#dialog").hidden || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) return;
      if ([" ", "Enter", "ArrowRight", "PageDown"].includes(e.key)) {
        const b = $("#weiter");
        if (b && !b.disabled) { e.preventDefault(); b.click(); }
      }
    };
    stopp = schleife(praesAbfrage, 1000);
  }

  async function praesAbfrage() {
    try {
      P.d = await api("GET", "host");
    } catch (e) {
      if (e.code === "passwort") { setzePw(""); toast("Bitte erneut anmelden"); startseite(); }
      throw e;
    }
    praesZeichnen();
  }

  function praesMenue() {
    const laeuft = P.d?.zustand?.gid && P.d.zustand.phase !== "leer";
    dialog(`<h2>Spielleitung</h2>
      <div style="display:grid;gap:10px">
        <button class="knopf gruen" data-m="neu">Neues Spiel starten</button>
        ${laeuft ? '<button class="knopf rot" data-m="beenden">Spiel beenden</button>' : ""}
        <button class="knopf weiss" data-m="creator">Fragen bearbeiten</button>
        <button class="knopf weiss" data-m="start">Zur Startseite</button>
      </div>`, (k, zu) => {
      $$("[data-m]", k).forEach((b) => (b.onclick = async () => {
        zu();
        const m = b.dataset.m;
        if (m === "creator") return creator();
        if (m === "start") return startseite();
        if (m === "neu") {
          if (laeuft && !(await fragen("Neues Spiel?", "Das laufende Spiel und alle Punkte werden gelöscht. Die Mitspieler melden sich neu an.", "Neues Spiel"))) return;
          return praesAktion({ aktion: "neu" });
        }
        if (m === "beenden" && (await fragen("Spiel beenden?", "Die Mitspieler sehen danach „Das Spiel ist beendet“.", "Beenden"))) praesAktion({ aktion: "beenden" });
      }));
    });
  }

  async function praesAktion(body) {
    if (P.sendet) return;
    P.sendet = true;
    const b = $("#weiter");
    if (b) b.disabled = true;
    try {
      P.d = await api("POST", "host", body);
      praesZeichnen();
    } catch (e) {
      toast(e.code === "keine_fragen" ? "Es gibt noch keine vollständige Frage. Leg im Creator welche an." : "Das hat nicht geklappt — nochmal versuchen");
      if (b) b.disabled = false;
    } finally {
      P.sendet = false;
    }
  }

  function weiterKnopf(text, klasse = "gruen", aktiv = true) {
    return `<button class="knopf riesig ${klasse}" id="weiter" ${aktiv ? "" : "disabled"}>${text}</button>`;
  }

  function avatarReihe(spieler, art) {
    const z = P.d.zustand;
    return spieler.map((p) => {
      let stimmung = "ruhig", haken = false, platz = null;
      if (art === "antworten") haken = p.hat != null;
      if (art === "aufloesung") {
        const l = z.zuletzt?.[p.slot];
        stimmung = l && l.p > 0 ? "froh" : "traurig";
      }
      if (art === "finale") stimmung = "froh";
      if (art === "aufloesung" || art === "finale") {
        const i = (z.rangliste || []).findIndex((r) => r.slot === p.slot);
        if (i >= 0 && i < 3 && z.rangliste[i].punkte > 0) { platz = i + 1; if (stimmung === "froh") stimmung = "jubel"; }
      }
      return Avatare.html(p.avatar, { name: p.name, stimmung, haken, platz });
    }).join("");
  }

  function praesZeichnen() {
    const { zustand: z, spieler } = P.d;
    const phase = z.gid ? z.phase : "leer";

    $("#p-titel").textContent = z.titel || "Baumpflege-Quizduell";
    $("#p-nr").innerHTML = ["frage", "antworten", "aufloesung"].includes(phase) ? `<span class="pille gelb">Frage ${z.nr + 1} von ${z.anzahl}</span>` : "";
    const anz = $("#p-anz");
    anz.hidden = phase === "leer";
    anz.textContent = `${spieler.length} ${spieler.length === 1 ? "Mitspieler" : "Mitspieler"}`;

    // Neue Mitspieler begrüßen
    const slots = new Set(spieler.map((p) => p.slot));
    const neu = P.bekannte ? spieler.filter((p) => !P.bekannte.has(p.slot)).map((p) => p.slot) : [];
    if (neu.length) Ton.zwitschern();
    P.bekannte = slots;

    const key = `${z.gid}|${phase}|${z.nr}`;
    const neuePhase = key !== P.key;
    P.key = key;
    if (neuePhase) { P.finaleTimer.forEach(clearTimeout); P.finaleTimer = []; takt = null; P.sek = null; }

    const mitte = $("#mitte"), fuss = $("#fuss");

    if (phase === "leer") {
      if (neuePhase) {
        mitte.innerHTML = `<div class="praes-leer"><div class="karte">
          ${Avatare.html(7, { name: "Eiche Ottilie", stimmung: "froh", groesse: "130px" })}
          <h2>Bereit fürs Quizduell?</h2>
          <p id="quiz-info">Fragen werden geladen …</p>
          <div class="knopfzeile">${weiterKnopf("Neues Spiel starten")}<button class="knopf weiss" id="zum-creator">Fragen bearbeiten</button></div>
        </div></div>`;
        fuss.innerHTML = "";
        $("#weiter").onclick = () => { Ton.klick(); praesAktion({ aktion: "neu" }); };
        $("#zum-creator").onclick = creator;
        api("GET", "quiz").then((q) => {
          const n = (q.fragen || []).filter(spielbar).length;
          const info = $("#quiz-info");
          if (!info) return;
          info.textContent = n
            ? `»${q.titel}« mit ${n} ${n === 1 ? "Frage" : "Fragen"}. Starte ein Spiel, dann können sich alle mit dem Handy anmelden.`
            : "Es gibt noch keine vollständige Frage. Leg sie zuerst im Creator an.";
          $("#weiter").disabled = !n;
        }).catch(() => {});
      }
      return;
    }

    if (phase === "lobby") {
      if (neuePhase) {
        const adresse = location.origin + location.pathname.replace(/index\.html$/, "") + "#mitspielen";
        mitte.innerHTML = `<div class="lobby">
          <div class="karte beitritt">
            <h2>Mach mit!</h2>
            <div class="qr" id="qr"><div class="warten-blatt"><i></i><i></i><i></i></div></div>
            <div class="adresse">${esc(adresse.replace(/^https?:\/\//, ""))}</div>
            <p style="margin:0;font-weight:700;color:var(--ink-2)">Handykamera auf den Code halten oder die Adresse eintippen, dann „Teilnehmer“ wählen.</p>
          </div>
          <div class="karte wiese"><h2 id="wiese-titel"></h2><div class="wiese-avatare" id="wiese"></div></div>
        </div>`;
        fuss.innerHTML = `<div class="reihe"></div><div class="aktion">${weiterKnopf("Quiz starten ▶")}</div>`;
        $("#weiter").onclick = () => { Ton.klick(); praesAktion({ aktion: "weiter", von: "lobby", nr: z.nr }); };
        zeichneQr(adresse);
      }
      $("#wiese-titel").textContent = spieler.length ? `Schon dabei: ${spieler.length}` : "Wer traut sich?";
      const wiese = $("#wiese");
      const wieseKey = spieler.map((p) => p.slot).join(",");
      if (wiese.dataset.key !== wieseKey) {
        wiese.dataset.key = wieseKey;
        wiese.innerHTML = spieler.length
          ? spieler.map((p) => `<button data-slot="${p.slot}" title="Antippen zum Entfernen">${Avatare.html(p.avatar, { name: p.name, stimmung: "froh", extraKlasse: neu.includes(p.slot) ? "neu" : "" })}</button>`).join("")
          : `<p class="leer-hinweis">Noch niemand da. Sobald sich jemand anmeldet, hüpft sein Avatar hier auf die Wiese.</p>`;
        $$("[data-slot]", wiese).forEach((b) => (b.onclick = async () => {
          const p = spieler.find((x) => x.slot === +b.dataset.slot);
          if (p && (await fragen(`${p.name} entfernen?`, "Der Avatar verschwindet aus dem Spiel. Die Person kann sich neu anmelden.", "Entfernen"))) {
            praesAktion({ aktion: "entfernen", slot: p.slot });
          }
        }));
      }
      $("#weiter").disabled = !spieler.length || P.sendet;
      return;
    }

    const f = z.frage || {};
    const bild = f.bild ? `<img src="${esc(bildUrl(f.bild))}" alt="">` : "";

    if (phase === "frage") {
      if (neuePhase) {
        Ton.rauschen();
        mitte.innerHTML = `<div class="frage-nur"><div class="karte fragekarte${bild ? " mit-bild" : ""}"><div class="text">${esc(f.text)}</div>${bild}</div></div>`;
        fuss.innerHTML = `<div class="reihe" id="reihe"></div><div class="aktion">${weiterKnopf("Antworten zeigen ▶", "")}</div>`;
        $("#weiter").onclick = () => { Ton.klick(); praesAktion({ aktion: "weiter", von: "frage", nr: z.nr }); };
      }
      aktualisiereReihe(spieler, "frage");
      return;
    }

    const richtige = liste(f.richtig);
    const mehrfachHinweis = richtige.length > 1 ? '<span class="pille gelb mehrfach">Mehrere Antworten richtig</span>' : "";
    const antwortKacheln = (mitWertung) => (f.antworten || []).map((t, i) => {
      if (!t || !t.trim()) return "";
      let extra = "", wer = "";
      if (mitWertung) {
        extra = richtige.includes(i) ? " richtig" : " falsch";
        const leute = spieler.filter((p) => liste(z.zuletzt?.[p.slot]?.c).includes(i));
        // Gesicht nach dem Gesamtergebnis: bei Mehrfachfragen zählt nur die komplett richtige Auswahl
        wer = `<span class="wer">${leute.slice(0, 4).map((p) => `<span class="mini" title="${esc(p.name)}">${Avatare.svg(p.avatar, z.zuletzt?.[p.slot]?.p > 0 ? "froh" : "traurig")}</span>`).join("")}<span class="anz">${z.verteilung?.[i] || 0}</span></span>`;
      }
      return `<div class="antwort a${i + 1}${extra}"><span class="marke">${MARKE[i]}<b>${BUCHSTABEN[i]}</b></span><span class="text-a">${esc(t)}</span>${wer}</div>`;
    }).join("");

    if (phase === "antworten") {
      if (neuePhase) {
        Ton.auftritt();
        mitte.innerHTML = `<div class="frage-gross mit-antworten">
          <div class="karte fragekarte${bild ? " mit-bild" : ""}"><div><div class="text">${esc(f.text)}</div>${mehrfachHinweis}</div>${bild}</div>
          <div class="antworten-gross">${antwortKacheln(false)}</div></div>`;
        fuss.innerHTML = `<div class="reihe" id="reihe"></div>
          <div class="aktion" style="grid-template-columns:auto auto;align-items:center;gap:18px">
            <div style="display:grid;justify-items:center;gap:6px">
              <div class="uhr" id="uhr" title="So viele haben schon geantwortet"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#2b1d14" stroke-width="5"/><circle id="uhr-ring" cx="50" cy="50" r="38" fill="none" stroke="#2f9e44" stroke-width="12" stroke-dasharray="238.8" stroke-dashoffset="238.8" stroke-linecap="round" style="transition:stroke-dashoffset .4s"/></svg><div class="zahl" id="uhr-zahl">0</div></div>
              <span class="zaehler" id="zaehler"></span>
            </div>
            ${weiterKnopf("Auflösen ▶", "orange")}
          </div>`;
        $("#weiter").onclick = () => { Ton.klick(); praesAktion({ aktion: "weiter", von: "antworten", nr: z.nr }); };
      }
      aktualisiereReihe(spieler, "antworten");
      praesKnopfStatus();
      return;
    }

    if (phase === "aufloesung") {
      if (neuePhase) {
        Ton.aufloesung();
        const ebild = f.erklBild ? `<img src="${esc(bildUrl(f.erklBild))}" alt="">` : "";
        const top = (z.rangliste || []).slice(0, 3).filter((r) => r.punkte > 0);
        mitte.innerHTML = `<div class="aufloesung">
          <div class="aufloesung-links">
            <div class="karte fragekarte" style="padding:1.4vh 2vw"><div class="text" style="font-size:clamp(1.1rem,1.8vw,2.2rem)">${esc(f.text)}</div></div>
            <div class="antworten-gross">${antwortKacheln(true)}</div>
            ${f.erkl || ebild ? `<div class="karte erklaerung${ebild ? " mit-bild" : ""}"><div><h3>Erklärung</h3>${f.erkl ? `<p>${esc(f.erkl)}</p>` : ""}</div>${ebild}</div>` : "<div></div>"}
          </div>
          <div class="karte bestenliste"><h3>Die Besten</h3>
            ${top.length ? top.map((r, i) => `<div class="eintrag">${Avatare.html(r.avatar, { name: r.name, stimmung: "jubel", platz: i + 1 })}<div class="pkt">${fmt(r.punkte)}<small>${z.zuletzt?.[r.slot]?.p ? "+" + fmt(z.zuletzt[r.slot].p) : "&nbsp;"}</small></div></div>`).join("") : '<p class="leer-hinweis">Noch keine Punkte</p>'}
          </div></div>`;
        const letzte = z.nr + 1 >= z.anzahl;
        fuss.innerHTML = `<div class="reihe" id="reihe"></div><div class="aktion">${weiterKnopf(letzte ? "Zur Siegerehrung 🏆" : "Nächste Frage ▶")}</div>`;
        $("#weiter").onclick = () => { Ton.klick(); praesAktion({ aktion: "weiter", von: "aufloesung", nr: z.nr }); };
      }
      aktualisiereReihe(spieler, "aufloesung");
      return;
    }

    if (phase === "finale") {
      if (neuePhase) {
        const top = (z.rangliste || []).slice(0, 3).filter((r) => r.punkte > 0);
        const stufe = (i) => {
          const r = top[i];
          if (!r) return `<div class="stufe p${i + 1}"></div>`;
          return `<div class="stufe p${i + 1}" id="stufe${i + 1}">
            ${Avatare.html(r.avatar, { name: r.name, stimmung: "jubel", platz: i + 1 })}
            <div class="block"><span class="zahl">${i + 1}</span><span class="pkt">${fmt(r.punkte)} P</span></div></div>`;
        };
        mitte.innerHTML = `<div class="finale"><h2>Die besten Baumpfleger!</h2>
          <div class="podest">${stufe(1)}${stufe(0)}${stufe(2)}</div></div>`;
        fuss.innerHTML = `<div class="reihe" id="reihe"></div><div class="aktion"><button class="knopf weiss" id="neues-spiel">Neues Spiel</button></div>`;
        $("#neues-spiel").onclick = async () => {
          if (await fragen("Neues Spiel?", "Alle Punkte werden gelöscht. Die Mitspieler melden sich neu an.", "Neues Spiel", "gruen")) praesAktion({ aktion: "neu" });
        };
        // Platz 3, dann 2, dann 1 — jeweils mit Trommelwirbel
        const zeige = (p, t) => P.finaleTimer.push(
          setTimeout(() => Ton.wirbel(1.4), t),
          setTimeout(() => {
            const el = $("#stufe" + p);
            if (el) el.classList.add("da");
            if (p === 1) { Ton.fanfare(); konfetti(7000, 220); } else Ton.richtig();
          }, t + 1500)
        );
        const plaetze = [3, 2, 1].filter((p) => top[p - 1]);
        plaetze.forEach((p, i) => zeige(p, 400 + i * 2600));
      }
      aktualisiereReihe(spieler, "finale");
    }
  }

  function aktualisiereReihe(spieler, art) {
    const reihe = $("#reihe");
    if (!reihe) return;
    const k = art + "|" + spieler.map((p) => p.slot + ":" + (art === "antworten" ? (p.hat != null ? 1 : 0) : "")).join(",");
    if (reihe.dataset.key === k) return;
    reihe.dataset.key = k;
    reihe.innerHTML = avatarReihe(spieler, art);
  }

  function praesKnopfStatus() {
    const z = P.d?.zustand;
    const b = $("#weiter");
    if (!z || z.phase !== "antworten" || !b) return;
    // Kein Zeitlimit: Der Ring zeigt, wie viele schon geantwortet haben,
    // aufgelöst wird jederzeit per Klick
    const sp = P.d.spieler;
    const fertig = sp.filter((p) => p.hat != null).length;
    const alle = sp.length > 0 && fertig === sp.length;
    const z_ = $("#zaehler");
    if (z_) z_.textContent = alle ? "Alle haben geantwortet!" : `${fertig} von ${sp.length} geantwortet`;
    const ring = $("#uhr-ring"), zahl = $("#uhr-zahl");
    if (ring) ring.setAttribute("stroke-dashoffset", (238.8 * (1 - (sp.length ? fertig / sp.length : 0))).toFixed(1));
    if (zahl) zahl.textContent = fertig;
    const key = z.gid + "/" + z.nr;
    if (alle && P.alleGemeldet !== key) { P.alleGemeldet = key; Ton.zeitUm(); }
    b.classList.toggle("bereit", alle);
    b.disabled = P.sendet;
  }

  let qrBibliothek = null;
  function zeichneQr(text) {
    const ziel = () => $("#qr");
    const malen = () => {
      const el = ziel();
      if (!el) return;
      try {
        const qr = window.qrcode(0, "M");
        qr.addData(text);
        qr.make();
        el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } catch {
        el.innerHTML = '<p class="leer-hinweis">QR-Code nicht verfügbar</p>';
      }
    };
    if (window.qrcode) return malen();
    qrBibliothek = qrBibliothek || new Promise((ok, nein) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
      s.onload = ok; s.onerror = nein;
      document.head.appendChild(s);
    });
    qrBibliothek.then(malen).catch(() => {
      qrBibliothek = null;
      const el = ziel();
      if (el) el.innerHTML = '<p class="leer-hinweis">QR-Code konnte nicht geladen werden — bitte die Adresse darunter nutzen.</p>';
    });
  }

  // Gleiche Prüfung wie auf dem Server (spiel.mjs)
  function spielbar(f) {
    if (!f || !String(f.text || "").trim()) return false;
    const a = (f.antworten || []).map((x) => String(x || "").trim());
    if (a.filter(Boolean).length < 2) return false;
    const r = liste(f.richtig);
    return r.length > 0 && r.every((i) => !!a[i]);
  }
  function maengel(f) {
    const m = [];
    if (!String(f.text || "").trim()) m.push("Fragetext fehlt");
    const a = (f.antworten || []).map((x) => String(x || "").trim());
    const r = liste(f.richtig);
    if (a.filter(Boolean).length < 2) m.push("mind. 2 Antworten");
    else if (!r.length) m.push("keine richtige Antwort markiert");
    else if (r.some((i) => !a[i])) m.push("richtige Antwort ist leer");
    return m;
  }

  /* =========================================================
     Creator (Desktop)
     ========================================================= */
  const C = { quiz: null, aktiv: 0, timer: null, stand: "gespeichert", loeschBereit: false };

  async function creator() {
    wechsle("creator", "creator");
    app.innerHTML = `<div class="creator"><div class="creator-kopf"><span class="titel">Creator</span></div><div class="creator-koerper"><div class="warten-blatt"><i></i><i></i><i></i></div></div></div>`;
    try {
      C.quiz = await api("GET", "quiz");
    } catch (e) {
      if (e.code === "passwort") { setzePw(""); toast("Bitte erneut anmelden"); return startseite(); }
      toast("Fragen konnten nicht geladen werden");
      return;
    }
    C.quiz.fragen = C.quiz.fragen || [];
    C.aktiv = Math.min(C.aktiv, Math.max(0, C.quiz.fragen.length - 1));
    C.stand = "gespeichert";
    creatorZeichnen();
  }

  function neueFrage() {
    return { id: Math.random().toString(36).slice(2, 10), text: "", bild: null, antworten: ["", "", "", ""], richtig: [0], erkl: "", erklBild: null };
  }

  function creatorZeichnen() {
    app.innerHTML = `<div class="creator">
      <div class="creator-kopf">
        <span class="titel">Creator</span>
        <label class="titel-feld"><input class="eingabe" id="c-titel" maxlength="80" aria-label="Name des Quiz" value="${esc(C.quiz.titel)}" placeholder="Name des Quiz"></label>
        <span class="speicherstand" id="c-stand"></span>
        <span style="flex:1"></span>
        <button class="knopf weiss klein" id="c-sichern" title="Alle Fragen samt Bildern als Datei herunterladen">Quiz sichern</button>
        <button class="knopf weiss klein" id="c-einspielen" title="Gesicherte Datei wieder einlesen">Einspielen</button>
        <input type="file" id="c-datei" accept=".json,application/json" hidden>
        <button class="knopf klein" id="c-praes">Präsentieren ▶</button>
        <button class="rundknopf" data-heim-c aria-label="Startseite">${ICON.haus}</button>
      </div>
      <div class="creator-koerper">
        <nav class="karte fragenliste" aria-label="Fragen">
          <h2>Fragen <span class="pille" id="c-anzahl"></span></h2>
          <ol id="c-liste"></ol>
          <button class="knopf gruen" id="c-neu">+ Neue Frage</button>
        </nav>
        <section id="c-editor"></section>
      </div>
    </div>`;
    $("#c-titel").oninput = (e) => { C.quiz.titel = e.target.value; spaeterSpeichern(); };
    $("#c-neu").onclick = () => {
      C.quiz.fragen.push(neueFrage());
      C.aktiv = C.quiz.fragen.length - 1;
      Ton.plopp();
      spaeterSpeichern();
      listeZeichnen(); editorZeichnen();
      setTimeout(() => $("#f-text")?.focus(), 30);
    };
    $("#c-praes").onclick = async () => { await jetztSpeichern(); praesentieren(); };
    $("[data-heim-c]").onclick = async () => { await jetztSpeichern(); startseite(); };
    $("#c-sichern").onclick = quizSichern;
    $("#c-einspielen").onclick = () => $("#c-datei").click();
    $("#c-datei").onchange = (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) quizEinspielen(f); };
    standZeigen();
    listeZeichnen();
    editorZeichnen();
  }

  function standZeigen() {
    const el = $("#c-stand");
    if (!el) return;
    el.textContent = { gespeichert: "✓ Gespeichert", ungespeichert: "Änderungen …", speichert: "Speichert …", fehler: "⚠ Nicht gespeichert" }[C.stand];
  }

  function spaeterSpeichern() {
    C.stand = "ungespeichert"; standZeigen();
    clearTimeout(C.timer);
    C.timer = setTimeout(jetztSpeichern, 900);
  }

  async function jetztSpeichern() {
    clearTimeout(C.timer);
    if (C.stand === "gespeichert" || !C.quiz) return;
    C.stand = "speichert"; standZeigen();
    try {
      await api("POST", "quiz", C.quiz);
      if (C.stand === "speichert") C.stand = "gespeichert";
    } catch (e) {
      C.stand = "fehler";
      toast(e.code === "voll" ? "Lokaler Speicher voll — Bilder sind zu groß" : "Speichern fehlgeschlagen — ich versuche es gleich nochmal");
      C.timer = setTimeout(jetztSpeichern, 4000);
    }
    standZeigen();
  }
  window.addEventListener("beforeunload", (e) => {
    if (document.body.dataset.modus === "creator" && C.stand !== "gespeichert") { e.preventDefault(); e.returnValue = ""; }
  });

  function listeZeichnen() {
    const fr = C.quiz.fragen;
    $("#c-anzahl").textContent = `${fr.filter(spielbar).length} / ${fr.length} spielbereit`;
    const liste = $("#c-liste");
    liste.innerHTML = fr.length
      ? fr.map((f, i) => {
          const m = maengel(f);
          return `<li><button class="listeneintrag${i === C.aktiv ? " aktiv" : ""}" data-i="${i}">
            <span class="nr">${i + 1}</span>
            <span class="vorschau-text">${esc(f.text.trim() || "Neue Frage")}${m.length ? `<small>${esc(m.join(" · "))}</small>` : ""}</span>
            ${f.bild ? `<img class="mini-bild" src="${esc(bildUrl(f.bild))}" alt="">` : "<span></span>"}
          </button></li>`;
        }).join("")
      : `<li class="leere-liste">Noch keine Fragen.</li>`;
    $$("[data-i]", liste).forEach((b) => (b.onclick = () => { C.aktiv = +b.dataset.i; C.loeschBereit = false; listeZeichnen(); editorZeichnen(); }));
  }

  function listenEintragAktualisieren() {
    const f = C.quiz.fragen[C.aktiv];
    const b = $(`#c-liste [data-i="${C.aktiv}"] .vorschau-text`);
    if (!b) return;
    const m = maengel(f);
    b.innerHTML = `${esc(f.text.trim() || "Neue Frage")}${m.length ? `<small>${esc(m.join(" · "))}</small>` : ""}`;
    $("#c-anzahl").textContent = `${C.quiz.fragen.filter(spielbar).length} / ${C.quiz.fragen.length} spielbereit`;
  }

  function bildFeld(feld, id) {
    return `<div class="bildfeld" data-bildfeld="${feld}" tabindex="0" aria-label="Bild ablegen oder auswählen">
      ${id
        ? `<div><img src="${esc(bildUrl(id))}" alt=""><div class="bild-knoepfe"><button class="knopf weiss klein" data-bild-waehlen>Anderes Bild</button><button class="knopf rot klein" data-bild-weg>Entfernen</button></div></div>`
        : `<div>Bild hierher ziehen,<br>einfügen (Strg + V) oder<div class="bild-knoepfe"><button class="knopf weiss klein" data-bild-waehlen>Bild auswählen</button></div></div>`}
      <input type="file" accept="image/*" hidden>
    </div>`;
  }

  function editorZeichnen() {
    const ed = $("#c-editor");
    const f = C.quiz.fragen[C.aktiv];
    if (!f) {
      ed.innerHTML = `<div class="karte leerer-editor">
        ${Avatare.html(0, { name: "Kletter-Karl", stimmung: "froh" })}
        <h2>Leg die erste Frage an</h2>
        <p>Jede Frage hat bis zu vier Antworten (A bis D), eine oder mehrere davon sind richtig. Dazu kannst du eine Erklärung schreiben, die nach der Auflösung erscheint. Bilder sind bei der Frage und bei der Erklärung möglich.</p>
        <button class="knopf gruen riesig" id="c-erste">+ Erste Frage</button>
      </div>`;
      $("#c-erste").onclick = () => $("#c-neu").click();
      return;
    }
    const n = C.quiz.fragen.length;
    ed.innerHTML = `<div class="karte editor">
      <div class="editor-kopf">
        <h2>Frage ${C.aktiv + 1}</h2>
        <div class="werkzeuge">
          <button class="knopf weiss klein" data-w="hoch" ${C.aktiv === 0 ? "disabled" : ""} title="Nach oben">↑</button>
          <button class="knopf weiss klein" data-w="runter" ${C.aktiv === n - 1 ? "disabled" : ""} title="Nach unten">↓</button>
          <button class="knopf weiss klein" data-w="kopie">Duplizieren</button>
          <button class="knopf weiss klein" data-w="loeschen">Löschen</button>
        </div>
      </div>
      <div class="zwei-spalten">
        <label class="feld"><span>Frage</span><textarea class="eingabe" id="f-text" rows="5" maxlength="400" placeholder="Wie lautet deine Frage?">${esc(f.text)}</textarea></label>
        <div class="feld"><span>Bild zur Frage (optional)</span>${bildFeld("bild", f.bild)}</div>
      </div>
      <div class="antwort-editor">
        <div class="feld"><span>Antworten</span><p class="hilfetext">Mindestens zwei Antworten ausfüllen und die richtige markieren. Sind mehrere richtig, alle anhaken – im Spiel steht dann „Mehrere Antworten richtig“. Leere Felder werden im Spiel ausgeblendet.</p></div>
        ${[0, 1, 2, 3].map((i) => `<div class="antwortzeile">
          <span class="marke a${i + 1}">${BUCHSTABEN[i]}</span>
          <input class="eingabe" id="f-a${i}" data-antwort="${i}" maxlength="140" value="${esc(f.antworten[i])}" placeholder="Antwort ${BUCHSTABEN[i]}" aria-label="Antwort ${BUCHSTABEN[i]}">
          <label class="richtig-wahl"><input type="checkbox" name="richtig" value="${i}" ${liste(f.richtig).includes(i) ? "checked" : ""}> richtig</label>
        </div>`).join("")}
      </div>
      <div class="zwei-spalten">
        <label class="feld"><span>Erklärung zur Auflösung (optional)</span><textarea class="eingabe" id="f-erkl" rows="5" maxlength="800" placeholder="Warum ist die Antwort richtig?">${esc(f.erkl)}</textarea></label>
        <div class="feld"><span>Bild zur Erklärung (optional)</span>${bildFeld("erklBild", f.erklBild)}</div>
      </div>
    </div>`;

    const geaendert = () => { spaeterSpeichern(); listenEintragAktualisieren(); };
    $("#f-text").oninput = (e) => { f.text = e.target.value; geaendert(); };
    $("#f-erkl").oninput = (e) => { f.erkl = e.target.value; geaendert(); };
    $$("[data-antwort]", ed).forEach((el) => (el.oninput = () => { f.antworten[+el.dataset.antwort] = el.value; geaendert(); }));
    $$('input[name="richtig"]', ed).forEach((el) => (el.onchange = () => { f.richtig = $$('input[name="richtig"]:checked', ed).map((x) => +x.value); Ton.plopp(); geaendert(); }));

    $$("[data-w]", ed).forEach((b) => (b.onclick = () => {
      const w = b.dataset.w, fr = C.quiz.fragen, i = C.aktiv;
      if (w === "hoch" && i > 0) { [fr[i - 1], fr[i]] = [fr[i], fr[i - 1]]; C.aktiv--; }
      else if (w === "runter" && i < fr.length - 1) { [fr[i + 1], fr[i]] = [fr[i], fr[i + 1]]; C.aktiv++; }
      else if (w === "kopie") { fr.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(fr[i])), id: neueFrage().id }); C.aktiv++; toast("Frage dupliziert"); }
      else if (w === "loeschen") {
        if (!C.loeschBereit) {
          C.loeschBereit = true;
          b.textContent = "Wirklich löschen?";
          b.classList.add("loeschen-bestaetigen");
          setTimeout(() => { if (b.isConnected) { C.loeschBereit = false; b.textContent = "Löschen"; b.classList.remove("loeschen-bestaetigen"); } }, 3500);
          return;
        }
        fr.splice(i, 1);
        C.aktiv = Math.max(0, Math.min(i, fr.length - 1));
        toast("Frage gelöscht");
      }
      C.loeschBereit = false;
      spaeterSpeichern(); listeZeichnen(); editorZeichnen();
    }));

    $$("[data-bildfeld]", ed).forEach((feld) => {
      const name = feld.dataset.bildfeld;
      const datei = $('input[type="file"]', feld);
      const waehlen = $("[data-bild-waehlen]", feld);
      waehlen && (waehlen.onclick = (e) => { e.preventDefault(); datei.click(); });
      const weg = $("[data-bild-weg]", feld);
      weg && (weg.onclick = (e) => { e.preventDefault(); f[name] = null; spaeterSpeichern(); listeZeichnen(); editorZeichnen(); });
      datei.onchange = () => { const d = datei.files[0]; datei.value = ""; if (d) bildHochladen(d, f, name); };
      feld.ondragover = (e) => { e.preventDefault(); feld.classList.add("ziehen"); };
      feld.ondragleave = () => feld.classList.remove("ziehen");
      feld.ondrop = (e) => {
        e.preventDefault(); feld.classList.remove("ziehen");
        const d = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith("image/"));
        if (d) bildHochladen(d, f, name);
      };
      feld.onpaste = (e) => {
        const d = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/"));
        if (d) { e.preventDefault(); bildHochladen(d, f, name); }
      };
    });
  }

  // Strg + V irgendwo im Creator: Bild landet bei der Frage
  document.addEventListener("paste", (e) => {
    if (document.body.dataset.modus !== "creator" || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest("[data-bildfeld]")) return;
    const d = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/"));
    const f = C.quiz?.fragen?.[C.aktiv];
    if (d && f) { e.preventDefault(); bildHochladen(d, f, "bild"); }
  });

  // Bild verkleinern (max. 1600 px, lokal 900 px) und als JPEG speichern
  function bildVerkleinern(datei) {
    return new Promise((ok, nein) => {
      const url = URL.createObjectURL(datei);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = LOKAL ? 900 : 1600;
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        const g = c.getContext("2d");
        g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", LOKAL ? 0.75 : 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); nein(new Error("bild")); };
      img.src = url;
    });
  }

  async function bildHochladen(datei, frage, feld) {
    toast("Bild wird hochgeladen …", 6000);
    try {
      const d = await bildVerkleinern(datei);
      const r = await api("POST", "bild", { d });
      frage[feld] = r.id;
      toast("Bild eingefügt");
      Ton.plopp();
      spaeterSpeichern(); listeZeichnen(); editorZeichnen();
    } catch (e) {
      toast(e.code === "voll" ? "Lokaler Speicher voll" : e.message === "bild" ? "Diese Datei lässt sich nicht als Bild öffnen" : "Bild konnte nicht hochgeladen werden");
    }
  }

  async function bildAlsDataUrl(id) {
    if (LOKAL) return bildUrl(id);
    const res = await fetch(bildUrl(id));
    if (!res.ok) throw new Error("bild");
    const blob = await res.blob();
    return new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
  }

  async function quizSichern() {
    await jetztSpeichern();
    toast("Sicherung wird erstellt …", 8000);
    try {
      const ids = new Set();
      C.quiz.fragen.forEach((f) => { f.bild && ids.add(f.bild); f.erklBild && ids.add(f.erklBild); });
      const bilder = {};
      for (const id of ids) { try { bilder[id] = await bildAlsDataUrl(id); } catch { /* Bild fehlt — überspringen */ } }
      const daten = { format: "baumpflege-quizduell", version: 1, gesichert: new Date().toISOString(), quiz: C.quiz, bilder };
      const blob = new Blob([JSON.stringify(daten)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `quizduell-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast("Sicherung heruntergeladen");
    } catch {
      toast("Sicherung fehlgeschlagen");
    }
  }

  async function quizEinspielen(datei) {
    let daten;
    try { daten = JSON.parse(await datei.text()); } catch { return toast("Diese Datei ist keine Quiz-Sicherung"); }
    if (daten?.format !== "baumpflege-quizduell" || !daten.quiz) return toast("Diese Datei ist keine Quiz-Sicherung");
    const n = (daten.quiz.fragen || []).length;
    if (!(await fragen("Sicherung einspielen?", `Die ${n} Fragen aus der Datei ersetzen die jetzigen ${C.quiz.fragen.length} Fragen.`, "Ersetzen"))) return;
    toast("Wird eingespielt …", 15000);
    try {
      const neu = {};
      for (const [alt, d] of Object.entries(daten.bilder || {})) {
        const r = await api("POST", "bild", { d });
        neu[alt] = r.id;
      }
      const q = daten.quiz;
      q.fragen = (q.fragen || []).map((f) => ({ ...neueFrage(), ...f, bild: f.bild ? neu[f.bild] || null : null, erklBild: f.erklBild ? neu[f.erklBild] || null : null }));
      C.quiz = q;
      C.aktiv = 0;
      C.stand = "ungespeichert";
      await jetztSpeichern();
      creatorZeichnen();
      toast(`${n} Fragen eingespielt`);
    } catch {
      toast("Einspielen fehlgeschlagen");
    }
  }

  /* ---------- Los ---------- */
  function nachAdresse() {
    const h = location.hash.replace("#", "");
    if (h === "mitspielen") return teilnehmer();
    if (h === "creator" || h === "praesentieren") {
      if (!pw()) startseite();
      return gehe(h);
    }
    startseite();
  }
  window.addEventListener("hashchange", nachAdresse);
  nachAdresse();
})();
