// Baumpflege-Quizduell — Server
//
// Eine Funktion bedient /api/*. Die eigentliche Spiellogik steht in
// ../spiel.mjs; hier wird nur Netlify Blobs angeschlossen.

import { getStore } from "@netlify/blobs";
import { bearbeite } from "../spiel.mjs";

export const config = { path: "/api/*" };

// Passwort für Creator- und Präsentiermodus. Lässt sich bei Netlify unter
// „Environment variables" mit QUIZ_PASSWORT überschreiben.
const PASSWORT = process.env.QUIZ_PASSWORT || "12345";

// region: Speicher in Frankfurt. consistency "strong": eine Antwort ist
// sofort für den Präsentiermodus sichtbar.
const speicher = () => {
  const b = getStore({ name: "quizduell", region: "eu-central-1", consistency: "strong" });
  return {
    get: (k) => b.get(k, { type: "json" }),
    set: (k, v) => b.setJSON(k, v),
    del: (k) => b.delete(k)
  };
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });

export default async (req) => {
  const url = new URL(req.url);
  const pfad = url.pathname.replace(/^\/(\.netlify\/functions\/)?api\/?/, "");

  let body = null;
  if (req.method === "POST") {
    // Eigener Kopf: ein Formular einer fremden Seite kann ihn nicht mitschicken
    if (req.headers.get("x-quiz") !== "1") return json({ fehler: "kein_header" }, 400);
    try { body = await req.json(); } catch { return json({ fehler: "kaputt" }, 400); }
  }

  try {
    const r = await bearbeite(speicher(), {
      methode: req.method,
      pfad,
      query: Object.fromEntries(url.searchParams),
      body,
      admin: req.headers.get("x-passwort") === PASSWORT
    });
    if (r.bild) {
      const m = /^data:([^;]+);base64,(.*)$/s.exec(r.bild);
      if (!m) return json({ fehler: "bild_kaputt" }, 500);
      return new Response(Buffer.from(m[2], "base64"), {
        status: 200,
        headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" }
      });
    }
    return json(r.data, r.status);
  } catch (e) {
    console.error(e);
    return json({ fehler: "server", info: String((e && e.message) || e) }, 500);
  }
};
