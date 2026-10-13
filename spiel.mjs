// Baumpflege-Quizduell — Spiellogik
//
// Diese Datei läuft zweimal: auf dem Server (funktionen/api.mjs reicht die
// Netlify-Blobs durch) und lokal im Browser (app.js reicht localStorage durch),
// damit sich alles ohne Server ausprobieren lässt.
//
// Gespeichert wird:
//   quiz              die Fragen aus dem Creator-Modus
//   bild/<id>         ein Bild als data-URL
//   zustand           der Spielstand — schreibt nur der Präsentiermodus
//   g/<spiel>/quiz    Abzug der Fragen beim Spielstart
//   g/<spiel>/s/<n>   ein Mitspieler — schreibt nur dieser Mitspieler
//
// Jeder Schlüssel hat genau einen Schreiber. Dadurch können viele Handys
// gleichzeitig antworten, ohne sich gegenseitig etwas zu überschreiben.
// Auf die Auflistung des Speichers wird bewusst verzichtet (im Betriebsbuch
// lieferte sie im Betrieb nichts) — Mitspieler belegen lückenlose Plätze 0, 1, 2 …

const MAX_SPIELER = 150;
const MAX_FRAGEN = 200;
const MAX_BILD = 4 * 1024 * 1024;

const ok = (data) => ({ status: 200, data });
const fehler = (code, status = 400) => ({ status, data: { fehler: code } });

const zufall = (n = 10) => {
  const z = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  const a = new Uint32Array(n);
  globalThis.crypto.getRandomValues(a);
  for (const x of a) s += z[x % z.length];
  return s;
};

const text = (v, max) => String(v ?? "").replace(/\s+$/g, "").slice(0, max);

// Eine Wahl oder die richtigen Antworten als sortierte Liste: 2 → [2], [3, 1, 3] → [1, 3].
// Ältere Daten mit einer einzelnen Zahl werden so ebenfalls verstanden.
export function liste(v) {
  const roh = Array.isArray(v) ? v : v == null ? [] : [v];
  return [...new Set(roh.filter((x) => [0, 1, 2, 3].includes(x)))].sort();
}
const gleicheListe = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Eine Frage gilt als spielbar, wenn sie Text, mindestens zwei Antworten und
// mindestens eine richtige Antwort hat — und jede richtige ist ausgefüllt.
export function spielbar(f) {
  if (!f || !String(f.text || "").trim()) return false;
  const a = (f.antworten || []).map((x) => String(x || "").trim());
  if (a.filter(Boolean).length < 2) return false;
  const r = liste(f.richtig);
  return r.length > 0 && r.every((i) => !!a[i]);
}

function sauberesQuiz(q) {
  const fragen = Array.isArray(q?.fragen) ? q.fragen.slice(0, MAX_FRAGEN) : [];
  return {
    titel: text(q?.titel, 80) || "Baumpflege-Quizduell",
    fragen: fragen.map((f) => ({
      id: text(f?.id, 20) || zufall(8),
      text: text(f?.text, 400),
      bild: f?.bild ? text(f.bild, 30) : null,
      antworten: [0, 1, 2, 3].map((i) => text(f?.antworten?.[i], 140)),
      richtig: liste(f?.richtig).length ? liste(f?.richtig) : [0],
      erkl: text(f?.erkl, 800),
      erklBild: f?.erklBild ? text(f.erklBild, 30) : null
    })),
    geaendert: Date.now()
  };
}

/* ---------- Mitspieler ---------- */

const spielerSchluessel = (gid, n) => `g/${gid}/s/${n}`;

// Liest Platz 0, 1, 2 … in Zwölferschritten, bis ein Platz leer ist.
async function alleSpieler(s, gid) {
  const liste = [];
  for (let start = 0; start < MAX_SPIELER; start += 12) {
    const teil = await Promise.all(
      Array.from({ length: 12 }, (_, i) => s.get(spielerSchluessel(gid, start + i)))
    );
    for (let i = 0; i < teil.length; i++) {
      if (!teil[i]) return liste;
      liste.push({ slot: start + i, ...teil[i] });
    }
  }
  return liste;
}

async function beitreten(s, body, jetzt, warte) {
  const z = await s.get("zustand");
  if (!z || !z.gid || z.phase === "leer") return fehler("kein_spiel", 409);
  if (z.phase === "finale") return fehler("spiel_vorbei", 409);
  const name = text(body?.name, 16).trim();
  if (!name) return fehler("name_fehlt");
  const avatar = Number.isInteger(body?.avatar) ? body.avatar : 0;
  const token = zufall(16);
  const datensatz = { name, avatar, token, seit: jetzt, antworten: {} };

  // Freien Platz suchen, belegen, kurz warten und nachsehen, ob er noch uns
  // gehört. Wollten zwei Handys im selben Moment denselben Platz, gewinnt der
  // spätere Schreiber, der andere rückt einfach einen Platz weiter.
  let n = 0;
  for (let versuch = 0; versuch < 40; versuch++) {
    while (n < MAX_SPIELER && (await s.get(spielerSchluessel(z.gid, n)))) n++;
    if (n >= MAX_SPIELER) return fehler("voll", 409);
    await s.set(spielerSchluessel(z.gid, n), datensatz);
    await warte(350 + Math.random() * 150);
    const pruef = await s.get(spielerSchluessel(z.gid, n));
    if (pruef && pruef.token === token) return ok({ gid: z.gid, slot: n, token });
    n++;
  }
  return fehler("kein_platz", 409);
}

/* ---------- Was ein Handy sehen darf ---------- */

function frageFuer(z) {
  const f = z.frage;
  if (!f) return null;
  const sicht = { text: f.text, bild: f.bild };
  if (z.phase === "antworten" || z.phase === "aufloesung") {
    sicht.antworten = f.antworten;
    sicht.mehrfach = liste(f.richtig).length > 1;
  }
  if (z.phase === "aufloesung") {
    sicht.richtig = liste(f.richtig);
    sicht.erkl = f.erkl;
    sicht.erklBild = f.erklBild;
  }
  return sicht;
}

function platzVon(rangliste, slot) {
  const i = (rangliste || []).findIndex((r) => r.slot === slot);
  return i < 0 ? null : i + 1;
}

async function zustandFuerSpieler(s, q, jetzt) {
  const z = (await s.get("zustand")) || { phase: "leer" };
  const antwort = {
    jetzt,
    gid: z.gid || null,
    phase: z.phase,
    titel: z.titel || "",
    nr: z.nr ?? 0,
    anzahl: z.anzahl ?? 0,
    start: z.start || null,
    deadline: z.deadline || null,
    frage: frageFuer(z),
    ich: null
  };
  const slot = Number.parseInt(q.slot, 10);
  if (z.gid && q.gid === z.gid && Number.isInteger(slot)) {
    const d = await s.get(spielerSchluessel(z.gid, slot));
    if (d && d.token === q.token) {
      if ((z.entfernt || []).includes(slot)) {
        antwort.ich = { entfernt: true };
      } else {
        const a = d.antworten?.[z.nr];
        const zuletzt = z.zuletzt?.[slot];
        antwort.ich = {
          name: d.name,
          avatar: d.avatar,
          wahl: a ? liste(a.c) : null,
          punkte: z.punkte?.[slot] || 0,
          platz: platzVon(z.rangliste, slot),
          von: (z.rangliste || []).length,
          letzte: z.phase === "aufloesung" ? (zuletzt || { c: null, p: 0 }) : null
        };
      }
    } else {
      antwort.ich = { unbekannt: true };
    }
  }
  if (z.phase === "finale") antwort.podest = (z.rangliste || []).slice(0, 3);
  return ok(antwort);
}

async function antworten(s, body, jetzt) {
  const z = await s.get("zustand");
  if (!z || z.phase !== "antworten") return fehler("keine_frage", 409);
  if (body?.gid !== z.gid || body?.nr !== z.nr) return fehler("falsche_frage", 409);
  if ((z.entfernt || []).includes(body.slot)) return fehler("entfernt", 403);
  // Bei Fragen mit mehreren richtigen Antworten darf mehr als eine gewählt werden
  const wahl = liste(body?.wahl);
  const mehrfach = liste(z.frage?.richtig).length > 1;
  if ((!mehrfach && wahl.length > 1) || wahl.some((i) => !String(z.frage?.antworten?.[i] || "").trim())) {
    return fehler("wahl_ungueltig");
  }
  const key = spielerSchluessel(z.gid, body.slot);
  const d = await s.get(key);
  if (!d || d.token !== body.token) return fehler("unbekannt", 403);
  d.antworten = d.antworten || {};
  // Bei unveränderter Wahl bleibt die frühere Zeit stehen (zählt für Tempo-Punkte)
  const vorher = d.antworten[z.nr] ? liste(d.antworten[z.nr].c) : null;
  if (!wahl.length) {
    // Alles wieder abgewählt — dann gilt die Frage als unbeantwortet
    if (vorher) { delete d.antworten[z.nr]; await s.set(key, d); }
  } else if (!vorher || !gleicheListe(vorher, wahl)) {
    d.antworten[z.nr] = { c: wahl, t: jetzt };
    await s.set(key, d);
  }
  return ok({ wahl });
}

/* ---------- Präsentiermodus ---------- */

async function hostSicht(s, jetzt) {
  const z = (await s.get("zustand")) || { phase: "leer" };
  let spieler = [];
  if (z.gid && z.phase !== "leer") {
    const weg = new Set(z.entfernt || []);
    spieler = (await alleSpieler(s, z.gid))
      .filter((p) => !weg.has(p.slot))
      .map((p) => ({
        slot: p.slot,
        name: p.name,
        avatar: p.avatar,
        hat: p.antworten?.[z.nr] ? liste(p.antworten[z.nr].c) : null
      }));
  }
  return ok({ jetzt, zustand: z, spieler });
}

// Punkte: richtig = 500, dazu bis zu 500 fürs Tempo (gemessen bis zur Auflösung). Bei mehreren richtigen
// Antworten gibt es nur Punkte, wenn genau diese gewählt wurden.
function wertung(z, spieler) {
  const punkte = { ...(z.punkte || {}) };
  const zuletzt = {};
  const verteilung = [0, 0, 0, 0];
  const weg = new Set(z.entfernt || []);
  const richtig = liste(z.frage.richtig);
  for (const p of spieler) {
    if (weg.has(p.slot)) continue;
    const a = p.antworten?.[z.nr];
    const wahl = a ? liste(a.c) : [];
    let pkt = 0;
    if (wahl.length) {
      for (const i of wahl) verteilung[i] += 1;
      if (gleicheListe(wahl, richtig)) {
        // Tempo im Verhältnis zur Zeit, bis aufgelöst wurde
        const fenster = Math.max(1000, z.deadline - z.start);
        const rest = Math.max(0, Math.min(1, 1 - (a.t - z.start) / fenster));
        pkt = 500 + Math.round(500 * rest);
      }
    }
    punkte[p.slot] = (punkte[p.slot] || 0) + pkt;
    zuletzt[p.slot] = { c: wahl.length ? wahl : null, p: pkt };
  }
  const rangliste = spieler
    .filter((p) => !weg.has(p.slot))
    .map((p) => ({ slot: p.slot, name: p.name, avatar: p.avatar, punkte: punkte[p.slot] || 0 }))
    .sort((a, b) => b.punkte - a.punkte || a.slot - b.slot);
  return { punkte, zuletzt, verteilung, rangliste };
}

async function hostAktion(s, body, jetzt) {
  const aktion = body?.aktion;
  let z = (await s.get("zustand")) || { phase: "leer" };

  if (aktion === "neu") {
    const quiz = await s.get("quiz");
    const fragen = (quiz?.fragen || []).filter(spielbar);
    if (!fragen.length) return fehler("keine_fragen", 409);
    // Mitspieler des alten Spiels aufräumen
    if (z.gid) {
      const alt = await alleSpieler(s, z.gid);
      await Promise.all(alt.map((p) => s.del(spielerSchluessel(z.gid, p.slot))));
      await s.del(`g/${z.gid}/quiz`);
    }
    const gid = zufall(6);
    await s.set(`g/${gid}/quiz`, { titel: quiz.titel, fragen });
    z = {
      gid, phase: "lobby", titel: quiz.titel, nr: 0, anzahl: fragen.length,
      frage: null, start: null, deadline: null,
      punkte: {}, zuletzt: {}, rangliste: [], verteilung: [0, 0, 0, 0], entfernt: [],
      seit: jetzt
    };
    await s.set("zustand", z);
    return hostSicht(s, jetzt);
  }

  if (!z.gid || z.phase === "leer") return fehler("kein_spiel", 409);

  if (aktion === "entfernen") {
    const slot = body.slot;
    if (Number.isInteger(slot) && !(z.entfernt || []).includes(slot)) {
      z.entfernt = [...(z.entfernt || []), slot];
      z.rangliste = (z.rangliste || []).filter((r) => r.slot !== slot);
      await s.set("zustand", z);
    }
    return hostSicht(s, jetzt);
  }

  if (aktion === "beenden") {
    z.phase = "leer";
    await s.set("zustand", z);
    return hostSicht(s, jetzt);
  }

  if (aktion !== "weiter") return fehler("aktion_unbekannt");
  // Doppelklick-Schutz: der Präsentiermodus sagt, aus welcher Phase er weiterschaltet
  if (body.von && (body.von !== z.phase || (body.nr ?? z.nr) !== z.nr)) return hostSicht(s, jetzt);

  const ladeFrage = async (nr) => {
    const quiz = await s.get(`g/${z.gid}/quiz`);
    const f = quiz?.fragen?.[nr];
    return f ? { text: f.text, bild: f.bild, antworten: f.antworten, richtig: f.richtig, erkl: f.erkl, erklBild: f.erklBild } : null;
  };

  if (z.phase === "lobby") {
    z.phase = "frage"; z.nr = 0; z.frage = await ladeFrage(0);
    z.start = null; z.deadline = null;
  } else if (z.phase === "frage") {
    z.phase = "antworten"; z.start = jetzt; z.deadline = null;  // kein Zeitlimit — offen bis zur Auflösung
  } else if (z.phase === "antworten") {
    // Mit dem Auflösen ist die Frage geschlossen; deadline merkt sich den Zeitpunkt
    z.deadline = jetzt;
    const spieler = await alleSpieler(s, z.gid);
    Object.assign(z, wertung(z, spieler));
    z.phase = "aufloesung";
  } else if (z.phase === "aufloesung") {
    if (z.nr + 1 < z.anzahl) {
      z.nr += 1; z.phase = "frage"; z.frage = await ladeFrage(z.nr);
      z.start = null; z.deadline = null; z.zuletzt = {}; z.verteilung = [0, 0, 0, 0];
    } else {
      z.phase = "finale";
    }
  } else {
    return hostSicht(s, jetzt);
  }
  await s.set("zustand", z);
  return hostSicht(s, jetzt);
}

/* ---------- Bilder ---------- */

async function bildSpeichern(s, body) {
  const d = String(body?.d || "");
  if (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(d)) return fehler("kein_bild");
  if (d.length > MAX_BILD * 1.4) return fehler("bild_zu_gross", 413);
  const id = zufall(12);
  await s.set("bild/" + id, { d });
  return ok({ id });
}

/* ---------- Verteiler ---------- */

export async function bearbeite(s, { methode, pfad, query = {}, body = null, admin = false, jetzt = Date.now(), warte }) {
  const teile = String(pfad || "").split("/").filter(Boolean);
  const wo = teile[0] || "";
  warte = warte || ((ms) => new Promise((r) => setTimeout(r, ms)));

  if (methode === "GET" && wo === "zustand") return zustandFuerSpieler(s, query, jetzt);
  if (methode === "POST" && wo === "beitreten") return beitreten(s, body, jetzt, warte);
  if (methode === "POST" && wo === "antwort") return antworten(s, body, jetzt);
  if (methode === "GET" && wo === "bild" && teile[1]) {
    const b = await s.get("bild/" + teile[1].replace(/[^a-z0-9]/g, ""));
    return b ? { status: 200, bild: b.d } : fehler("nicht_da", 404);
  }
  if (methode === "GET" && wo === "ping") return ok({ jetzt });

  // Ab hier nur mit Passwort
  if (!admin) return fehler("passwort", 401);
  if (methode === "GET" && wo === "pruefen") return ok({ ok: true });
  if (methode === "GET" && wo === "quiz") return ok((await s.get("quiz")) || { titel: "Baumpflege-Quizduell", fragen: [] });
  if (methode === "POST" && wo === "quiz") {
    const q = sauberesQuiz(body);
    await s.set("quiz", q);
    return ok({ geaendert: q.geaendert });
  }
  if (methode === "POST" && wo === "bild") return bildSpeichern(s, body);
  if (methode === "GET" && wo === "host") return hostSicht(s, jetzt);
  if (methode === "POST" && wo === "host") return hostAktion(s, body, jetzt);
  return fehler("unbekannt", 404);
}
