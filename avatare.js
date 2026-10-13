// Baumpflege-Quizduell — die 20 Avatare
//
// Jeder Avatar ist ein kleines SVG (120 × 120). Das Gesicht zeichnet eine
// gemeinsame Funktion, damit alle dieselben vier Stimmungen haben:
//   ruhig · froh (richtig) · traurig (falsch) · jubel (Platz 1–3)

(function () {
  const INK = "#2b1d14";

  function stern(cx, cy, r) {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const w = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      d += (i ? "L" : "M") + (cx + Math.cos(w) * rr).toFixed(1) + " " + (cy + Math.sin(w) * rr).toFixed(1);
    }
    return `<path d="${d}Z" fill="#ffd23f" stroke="${INK}" stroke-width="${(r * 0.18).toFixed(1)}" stroke-linejoin="round"/>`;
  }

  // o: { x, y, r, ex (halber Augenabstand), es (Augengröße), mund, my, mw, ink }
  function gesicht(o, stimmung) {
    const r = o.r || 20;
    const ink = o.ink || INK;
    const x = o.x, ex = o.ex ?? r * 0.48, es = o.es ?? r * 0.24;
    const ey = o.y - r * 0.12;
    const my = o.y + (o.my ?? r * 0.42), mw = o.mw ?? r * 0.42;
    const sw = Math.max(1.6, es * 0.42);
    let s = "";

    if (stimmung === "froh" || stimmung === "jubel") {
      for (const sx of [-1, 1]) {
        s += `<ellipse cx="${x + sx * (ex + es * 0.5)}" cy="${ey + es * 1.7}" rx="${es * 0.95}" ry="${es * 0.55}" fill="#ff7b9c" opacity=".6"/>`;
      }
    }

    for (const sx of [-1, 1]) {
      const cx = x + sx * ex;
      if (stimmung === "jubel") {
        s += stern(cx, ey, es * 1.25);
      } else if (stimmung === "froh") {
        s += `<path d="M${cx - es} ${ey + es * 0.35} Q${cx} ${ey - es * 1.15} ${cx + es} ${ey + es * 0.35}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      } else {
        s += `<circle cx="${cx}" cy="${ey}" r="${es}" fill="#fff" stroke="${ink}" stroke-width="${sw * 0.5}"/>`;
        const py = stimmung === "traurig" ? ey + es * 0.3 : ey + es * 0.05;
        s += `<circle class="pupille" cx="${cx}" cy="${py}" r="${es * 0.58}" fill="${ink}"/>`;
        s += `<circle cx="${cx + es * 0.22}" cy="${py - es * 0.22}" r="${es * 0.2}" fill="#fff"/>`;
        if (stimmung === "traurig") {
          // innere Brauen hoch
          const ix = cx - sx * es * 0.9, ax = cx + sx * es * 1.05;
          s += `<path d="M${ax} ${ey - es * 1.25} L${ix} ${ey - es * 1.95}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
        }
      }
    }

    if (stimmung === "traurig") {
      const tx = x + ex + es * 0.3, ty = ey + es * 1.3;
      s += `<path class="traene" d="M${tx} ${ty} q${es * 0.7} ${es * 1.1} 0 ${es * 1.5} q${-es * 0.7} ${-es * 0.4} 0 ${-es * 1.5}Z" fill="#4fc3f7" stroke="#0288d1" stroke-width=".8"/>`;
    }

    if (o.mund !== false) {
      if (stimmung === "froh" || stimmung === "jubel") {
        const k = stimmung === "jubel" ? 1.25 : 1;
        const w = mw * k;
        s += `<path d="M${x - w} ${my - w * 0.15} Q${x} ${my + w * 1.5} ${x + w} ${my - w * 0.15}Z" fill="${ink}" stroke="${ink}" stroke-width="${sw * 0.6}" stroke-linejoin="round"/>`;
        s += `<ellipse cx="${x}" cy="${my + w * 0.62}" rx="${w * 0.45}" ry="${w * 0.22}" fill="#ff6f8f"/>`;
      } else if (stimmung === "traurig") {
        s += `<path d="M${x - mw * 0.75} ${my + mw * 0.5} Q${x} ${my - mw * 0.4} ${x + mw * 0.75} ${my + mw * 0.5}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      } else {
        s += `<path d="M${x - mw * 0.7} ${my} Q${x} ${my + mw * 0.6} ${x + mw * 0.7} ${my}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`;
      }
    }
    return s;
  }

  // Schnabel für die Vögel — offen, wenn sie sich freuen
  const schnabel = (x, y, w, farbe, nachRechts) => (st) => {
    const offen = st === "froh" || st === "jubel";
    if (nachRechts) {
      return offen
        ? `<path d="M${x} ${y - 5} L${x + w} ${y - 3} L${x} ${y}Z" fill="${farbe}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${x} ${y + 2} L${x + w * 0.85} ${y + 7} L${x} ${y + 7}Z" fill="${farbe}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
        : `<path d="M${x} ${y - 5} L${x + w} ${y + 1} L${x} ${y + 6}Z" fill="${farbe}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
    return offen
      ? `<path d="M${x - 6} ${y} L${x} ${y - 4} L${x + 6} ${y}Z" fill="${farbe}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${x - 5} ${y + 3} L${x} ${y + 10} L${x + 5} ${y + 3}Z" fill="${farbe}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
      : `<path d="M${x - 6} ${y} L${x + 6} ${y} L${x} ${y + w}Z" fill="${farbe}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
  };

  const L = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`;

  // Stacheln für den Igel, Schuppen für den Zapfen — einmal ausrechnen
  let igelStacheln = "";
  for (let i = 0; i <= 14; i++) {
    const w = Math.PI * (1.02 + i * 0.07);
    const bx = 66 + Math.cos(w) * 34, by = 84 + Math.sin(w) * 26;
    const sx = 66 + Math.cos(w) * 50, sy = 84 + Math.sin(w) * 42;
    const w2 = w + 0.12;
    const cx2 = 66 + Math.cos(w2) * 34, cy2 = 84 + Math.sin(w2) * 26;
    igelStacheln += `L${bx.toFixed(1)} ${by.toFixed(1)} L${sx.toFixed(1)} ${sy.toFixed(1)} L${cx2.toFixed(1)} ${cy2.toFixed(1)} `;
  }
  let zapfenSchuppen = "";
  for (let reihe = 0; reihe < 7; reihe++) {
    const y = 40 + reihe * 10.5;
    const breite = 26 - Math.abs(reihe - 3) * 4.5;
    for (let k = -2; k <= 2; k++) {
      const x = 60 + k * breite * 0.42 + (reihe % 2 ? breite * 0.21 : 0);
      if (Math.abs(x - 60) > breite) continue;
      zapfenSchuppen += `<path d="M${x - 6} ${y} Q${x} ${y + 9} ${x + 6} ${y}" fill="none" stroke="#6d3d17" stroke-width="2" stroke-linecap="round"/>`;
    }
  }

  const AVATARE = [
    {
      name: "Kletter-Karl",
      farbe: "#ff7a1a",
      rumpf: `<path d="M20 120 Q20 94 60 94 Q100 94 100 120Z" fill="#2e9e5b" ${L}/>
        <path d="M44 96 L60 120 L76 96" fill="none" stroke="#ffd23f" stroke-width="5"/>
        <circle cx="60" cy="66" r="30" fill="#f6c9a0" ${L}/>`,
      gesicht: { x: 60, y: 72, r: 22 },
      vorne: `<path d="M27 60 A33 33 0 0 1 93 60 L98 63 Q60 54 22 63Z" fill="#ff7a1a" ${L}/>
        <rect x="54" y="28" width="12" height="10" rx="3" fill="#ffd23f" ${L}/>
        <circle cx="29" cy="70" r="9" fill="#ffd23f" ${L}/><circle cx="91" cy="70" r="9" fill="#ffd23f" ${L}/>`
    },
    {
      name: "Eichel-Erna",
      farbe: "#d9993b",
      rumpf: `<path d="M28 58 Q26 104 60 114 Q94 104 92 58Z" fill="#e2a64a" ${L}/>
        <rect x="56" y="12" width="8" height="18" rx="4" fill="#6b4226" ${L}/>
        <path d="M22 60 Q22 28 60 28 Q98 28 98 60 Q60 68 22 60Z" fill="#7a4b26" ${L}/>
        <path d="M34 44 l6 6 m6 -10 l6 6 m6 -8 l6 6 m6 -4 l6 6 m-38 6 l6 6 m10 -6 l6 6 m10 -6 l6 6" stroke="#5a3418" stroke-width="2.5" stroke-linecap="round"/>`,
      gesicht: { x: 60, y: 82, r: 20 }
    },
    {
      name: "Nussi Hörnchen",
      farbe: "#d9773a",
      rumpf: `<path d="M80 108 C122 96 120 34 94 26 C76 20 68 42 84 50 C98 58 100 84 80 108Z" fill="#c8642b" ${L}/>
        <ellipse cx="54" cy="92" rx="26" ry="24" fill="#d9773a" ${L}/>
        <ellipse cx="54" cy="98" rx="14" ry="15" fill="#f5d6b0"/>
        <path d="M34 40 L36 18 L50 32Z M74 40 L72 18 L58 32Z" fill="#d9773a" ${L}/>
        <circle cx="54" cy="56" r="25" fill="#d9773a" ${L}/>
        <ellipse cx="54" cy="66" rx="13" ry="10" fill="#f5d6b0"/>`,
      gesicht: { x: 54, y: 58, r: 19, my: 9 },
      vorne: `<ellipse cx="54" cy="104" rx="8" ry="9" fill="#a0632f" ${L}/><path d="M46 100 Q54 92 62 100Z" fill="#6b4226" ${L}/>`
    },
    {
      name: "Klopfi Specht",
      farbe: "#e63946",
      rumpf: `<path d="M30 86 Q30 116 60 116 Q90 116 90 86 L90 60 L30 60Z" fill="#2b2b2b" ${L}/>
        <path d="M44 72 Q60 110 76 72Z" fill="#fafafa"/>
        <path d="M30 96 l8 -4 m-8 12 l8 -4 M90 96 l-8 -4 m8 12 l-8 -4" stroke="#fafafa" stroke-width="3" stroke-linecap="round"/>
        <circle cx="58" cy="52" r="28" fill="#fafafa" ${L}/>
        <path d="M34 38 Q58 18 82 38 Q58 30 34 38Z" fill="#2b2b2b"/>
        <path d="M40 30 Q58 14 76 30 Q58 25 40 30Z" fill="#e63946" ${L}/>
        <path d="M36 66 Q48 74 62 72" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      gesicht: { x: 56, y: 52, r: 20, mund: false },
      vorne: schnabel(82, 56, 26, "#7d6b4a", true)
    },
    {
      name: "Uhu-Ulla",
      farbe: "#8d6748",
      rumpf: `<path d="M28 40 L34 16 L48 32Z M92 40 L86 16 L72 32Z" fill="#7a5638" ${L}/>
        <ellipse cx="60" cy="72" rx="35" ry="42" fill="#8d6748" ${L}/>
        <ellipse cx="60" cy="88" rx="22" ry="24" fill="#e2cfaf"/>
        <path d="M50 82 l4 4 l4 -4 m4 0 l4 4 l4 -4 M48 94 l4 4 l4 -4 m4 0 l4 4 l4 -4 m4 0 l4 4 l4 -4 M54 106 l4 4 l4 -4 m4 0 l4 4 l4 -4" stroke="#a88a66" stroke-width="2" fill="none"/>
        <circle cx="46" cy="56" r="14" fill="#f7e7c6" ${L}/><circle cx="74" cy="56" r="14" fill="#f7e7c6" ${L}/>`,
      gesicht: { x: 60, y: 58, r: 26, ex: 14, es: 7.5, mund: false },
      vorne: schnabel(60, 66, 10, "#f2a33a", false)
    },
    {
      name: "Kastanien-Kalle",
      farbe: "#7b3f1e",
      rumpf: `<circle cx="60" cy="70" r="42" fill="#7cb342" ${L}/>
        <path d="M60 22 l0 -12 M92 36 l8 -8 M104 70 l12 0 M92 104 l8 8 M28 104 l-8 8 M16 70 l-12 0 M28 36 l-8 -8 M76 26 l4 -11 M44 26 l-4 -11 M101 52 l11 -5 M19 52 l-11 -5 M101 88 l11 5 M19 88 l-11 5" stroke="#558b2f" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="60" cy="72" r="30" fill="#7b3f1e" ${L}/>
        <path d="M36 88 Q60 108 84 88 Q60 96 36 88Z" fill="#e0c08a"/>
        <ellipse cx="46" cy="56" rx="8" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 46 56)"/>`,
      gesicht: { x: 60, y: 72, r: 18 }
    },
    {
      name: "Motorsägen-Moritz",
      farbe: "#ff7a1a",
      rumpf: `<rect x="72" y="62" width="44" height="20" rx="10" fill="#b0bec5" ${L}/>
        <rect x="72" y="62" width="44" height="20" rx="10" fill="none" stroke="#455a64" stroke-width="3" stroke-dasharray="4 3"/>
        <path d="M30 56 Q30 34 50 34 L66 34 Q74 34 74 44" fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round"/>
        <rect x="14" y="50" width="64" height="52" rx="14" fill="#ff7a1a" ${L}/>
        <rect x="14" y="88" width="64" height="14" rx="7" fill="#37474f" ${L}/>
        <rect x="22" y="56" width="10" height="5" rx="2" fill="#37474f"/>`,
      gesicht: { x: 46, y: 70, r: 17 }
    },
    {
      name: "Eiche Ottilie",
      farbe: "#43a047",
      rumpf: `<path d="M50 120 L52 82 L68 82 L70 120Z" fill="#7a4b26" ${L}/>
        <g fill="#43a047" ${L}>
        <circle cx="34" cy="60" r="20"/><circle cx="86" cy="60" r="20"/>
        <circle cx="44" cy="34" r="20"/><circle cx="76" cy="34" r="20"/></g>
        <circle cx="60" cy="58" r="30" fill="#4caf50"/>
        <circle cx="60" cy="26" r="16" fill="#4caf50"/>
        <circle cx="28" cy="78" r="5" fill="#a0632f" ${L}/><circle cx="94" cy="42" r="5" fill="#a0632f" ${L}/>`,
      gesicht: { x: 60, y: 54, r: 20 }
    },
    {
      name: "Tannen-Toni",
      farbe: "#2e7d32",
      rumpf: `<rect x="53" y="100" width="14" height="18" fill="#7a4b26" ${L}/>
        <path d="M60 6 L86 40 L34 40Z" fill="#388e3c" ${L}/>
        <path d="M60 24 L96 70 L24 70Z" fill="#2e7d32" ${L}/>
        <path d="M60 46 L108 104 L12 104Z" fill="#1b5e20" ${L}/>
        <ellipse cx="60" cy="82" rx="22" ry="16" fill="#a5d6a7"/>
        <circle cx="36" cy="96" r="4" fill="#e53935" ${L}/><circle cx="86" cy="94" r="4" fill="#ffd23f" ${L}/><circle cx="62" cy="40" r="4" fill="#1e88e5" ${L}/>`,
      gesicht: { x: 60, y: 82, r: 18 }
    },
    {
      name: "Birken-Bine",
      farbe: "#9ccc65",
      rumpf: `<path d="M38 120 L40 46 L80 46 L82 120Z" fill="#f4f1ec" ${L}/>
        <path d="M40 98 l10 0 M70 104 l11 0 M40 112 l14 2 M66 60 l14 0 M41 62 l8 2" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="60" cy="30" rx="44" ry="24" fill="#9ccc65" ${L}/>
        <path d="M30 26 q6 -6 12 0 M70 18 q6 -6 12 0 M50 36 q6 -6 12 0" stroke="#7cb342" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      gesicht: { x: 60, y: 76, r: 18 }
    },
    {
      name: "Fliegi Pilz",
      farbe: "#e53935",
      rumpf: `<path d="M40 64 L36 112 Q60 120 84 112 L80 64Z" fill="#fff4e0" ${L}/>
        <path d="M10 66 Q14 12 60 12 Q106 12 110 66 Q60 76 10 66Z" fill="#e53935" ${L}/>
        <g fill="#fff"><circle cx="36" cy="40" r="7"/><circle cx="62" cy="26" r="6"/><circle cx="86" cy="42" r="8"/><circle cx="56" cy="52" r="5"/><circle cx="20" cy="58" r="4"/><circle cx="100" cy="60" r="4"/></g>`,
      gesicht: { x: 60, y: 88, r: 16 }
    },
    {
      name: "Stachel Igel",
      farbe: "#5d4037",
      rumpf: `<path d="M32 84 ${igelStacheln} L100 84 Z" fill="#5d4037" ${L}/>
        <ellipse cx="66" cy="88" rx="36" ry="24" fill="#8d6e63" ${L}/>
        <path d="M18 92 Q24 66 50 66 Q64 70 66 92 Q50 110 18 92Z" fill="#e8cfae" ${L}/>
        <circle cx="16" cy="92" r="5" fill="#2b1d14"/>
        <ellipse cx="54" cy="64" rx="6" ry="5" fill="#e8cfae" ${L}/>`,
      gesicht: { x: 42, y: 86, r: 15, ex: 9, my: 7 },
      vorne: `<ellipse cx="44" cy="110" rx="7" ry="4" fill="#5d4037"/><ellipse cx="80" cy="110" rx="7" ry="4" fill="#5d4037"/>`
    },
    {
      name: "Biber Bodo",
      farbe: "#8d5a3b",
      rumpf: `<ellipse cx="98" cy="104" rx="20" ry="9" fill="#4e342e" ${L} transform="rotate(-25 98 104)"/>
        <path d="M86 98 l20 -10 M90 106 l18 -8" stroke="#6d4c41" stroke-width="2"/>
        <ellipse cx="60" cy="90" rx="32" ry="28" fill="#8d5a3b" ${L}/>
        <ellipse cx="60" cy="96" rx="18" ry="18" fill="#c49a76"/>
        <circle cx="38" cy="34" r="8" fill="#8d5a3b" ${L}/><circle cx="82" cy="34" r="8" fill="#8d5a3b" ${L}/>
        <circle cx="60" cy="52" r="27" fill="#8d5a3b" ${L}/>
        <ellipse cx="60" cy="62" rx="14" ry="10" fill="#c49a76"/>
        <ellipse cx="60" cy="56" rx="5" ry="3.5" fill="#2b1d14"/>`,
      gesicht: { x: 60, y: 50, r: 20, my: 12, mw: 7 },
      vorne: `<rect x="54" y="66" width="12" height="11" rx="2" fill="#fff" ${L}/><path d="M60 66 L60 77" stroke="${INK}" stroke-width="1.5"/>`
    },
    {
      name: "Glücki Käfer",
      farbe: "#e53935",
      rumpf: `<path d="M48 26 Q40 10 30 12 M72 26 Q80 10 90 12" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="12" r="4" fill="${INK}"/><circle cx="90" cy="12" r="4" fill="${INK}"/>
        <circle cx="60" cy="40" r="20" fill="#2b2b2b" ${L}/>
        <circle cx="60" cy="74" r="40" fill="#e53935" ${L}/>
        <g fill="#2b2b2b"><circle cx="32" cy="58" r="7"/><circle cx="88" cy="58" r="7"/><circle cx="30" cy="92" r="6"/><circle cx="90" cy="92" r="6"/><circle cx="60" cy="108" r="5"/></g>`,
      gesicht: { x: 60, y: 76, r: 19 }
    },
    {
      name: "Ahorni Blatt",
      farbe: "#ff8f00",
      rumpf: `<path d="M60 100 L60 118" stroke="#8d4a16" stroke-width="5" stroke-linecap="round"/>
        <path d="M60 6 L68 30 L82 22 L78 44 L100 36 L92 56 L112 62 L88 76 L94 92 L68 86 L63 104 L57 104 L52 86 L26 92 L32 76 L8 62 L28 56 L20 36 L42 44 L38 22 L52 30Z" fill="#ff8f00" ${L}/>
        <path d="M60 100 L60 40 M60 74 L30 60 M60 74 L90 60" stroke="#e65100" stroke-width="2" fill="none" opacity=".5"/>`,
      gesicht: { x: 60, y: 64, r: 20 }
    },
    {
      name: "Hirschi Käfer",
      farbe: "#6d4c41",
      rumpf: `<path d="M48 40 Q30 30 32 8 Q40 22 46 18 M72 40 Q90 30 88 8 Q80 22 74 18" stroke="#8d4a16" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M34 82 l-16 -6 M34 96 l-18 4 M38 108 l-12 10 M86 82 l16 -6 M86 96 l18 4 M82 108 l12 10" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="60" cy="92" rx="28" ry="26" fill="#4e342e" ${L}/>
        <path d="M60 68 L60 118" stroke="#3e2723" stroke-width="2.5"/>
        <circle cx="60" cy="56" r="24" fill="#a1887f" ${L}/>`,
      gesicht: { x: 60, y: 58, r: 18 }
    },
    {
      name: "Stumpi Stumpf",
      farbe: "#8d6e63",
      rumpf: `<path d="M24 42 L26 102 Q14 112 10 116 L110 116 Q106 112 94 102 L96 42Z" fill="#8d6e63" ${L}/>
        <path d="M40 60 l0 18 M80 66 l0 22 M56 96 l0 14" stroke="#6d4c41" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="60" cy="42" rx="36" ry="13" fill="#e8c39e" ${L}/>
        <ellipse cx="60" cy="42" rx="24" ry="8" fill="none" stroke="#b98a5e" stroke-width="2"/>
        <ellipse cx="60" cy="42" rx="12" ry="4" fill="none" stroke="#b98a5e" stroke-width="2"/>
        <path d="M74 36 Q76 20 86 16 Q88 28 76 34" fill="#7cb342" ${L}/>`,
      gesicht: { x: 60, y: 76, r: 19 }
    },
    {
      name: "Raupe Rita",
      farbe: "#7cb342",
      rumpf: `<g ${L}>
        <circle cx="14" cy="100" r="11" fill="#9ccc65"/><circle cx="32" cy="100" r="13" fill="#7cb342"/>
        <circle cx="52" cy="96" r="14" fill="#9ccc65"/><circle cx="70" cy="86" r="15" fill="#7cb342"/></g>
        <path d="M84 40 Q80 22 72 18 M100 40 Q106 22 114 20" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="72" cy="18" r="4" fill="#ffd23f" ${L}/><circle cx="114" cy="20" r="4" fill="#ffd23f" ${L}/>
        <circle cx="90" cy="62" r="25" fill="#8bc34a" ${L}/>`,
      gesicht: { x: 90, y: 64, r: 18 }
    },
    {
      name: "Seil-Susi",
      farbe: "#fdd835",
      rumpf: `<circle cx="60" cy="62" r="48" fill="none" stroke="#fdd835" stroke-width="12"/>
        <circle cx="60" cy="62" r="48" fill="none" stroke="#e53935" stroke-width="12" stroke-dasharray="3 9"/>
        <circle cx="60" cy="62" r="36" fill="none" stroke="#fdd835" stroke-width="11"/>
        <circle cx="60" cy="62" r="36" fill="none" stroke="#1e88e5" stroke-width="11" stroke-dasharray="3 8"/>
        <circle cx="60" cy="62" r="26" fill="#fff3c4" ${L}/>
        <path d="M100 92 Q112 108 104 118" stroke="#fdd835" stroke-width="9" fill="none" stroke-linecap="round"/>`,
      gesicht: { x: 60, y: 62, r: 19 }
    },
    {
      name: "Zapfen-Zoe",
      farbe: "#a0632f",
      rumpf: `<path d="M50 28 Q44 12 34 10 M60 26 L60 8 M70 28 Q76 12 86 10" stroke="#388e3c" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="60" cy="72" rx="30" ry="44" fill="#a0632f" ${L}/>
        ${zapfenSchuppen}
        <ellipse cx="60" cy="76" rx="20" ry="18" fill="#c8874a"/>`,
      gesicht: { x: 60, y: 76, r: 17 }
    }
  ];

  function svg(i, stimmung) {
    const a = AVATARE[((i % AVATARE.length) + AVATARE.length) % AVATARE.length];
    const st = stimmung || "ruhig";
    const vorne = typeof a.vorne === "function" ? a.vorne(st) : (a.vorne || "");
    return `<svg class="ava-svg" viewBox="0 0 120 120" aria-hidden="true">${a.rumpf}${gesicht(a.gesicht, st)}${vorne}</svg>`;
  }

  const KRONE = {
    1: ["#ffd23f", "#e0a800"],
    2: ["#e3e8ec", "#9aa7b0"],
    3: ["#f0a868", "#b8692e"]
  };
  function krone(platz) {
    const [f, k] = KRONE[platz];
    return `<svg class="ava-krone" viewBox="0 0 60 40" aria-hidden="true"><path d="M6 34 L4 10 L18 22 L30 4 L42 22 L56 10 L54 34Z" fill="${f}" stroke="${k}" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="24" r="4" fill="#e53935"/><text x="30" y="33" text-anchor="middle" font-size="9" font-weight="800" fill="${k}">${platz}</text></svg>`;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Der fertige Avatar mit Namen darüber.
  // opt: { name, stimmung, platz (1–3 → Krone), groesse, haken, extraKlasse }
  function html(i, opt = {}) {
    const st = opt.stimmung || "ruhig";
    const k = ["ava", "st-" + st, opt.platz ? "platz-" + opt.platz : "", opt.extraKlasse || ""].join(" ");
    const g = opt.groesse ? ` style="--g:${opt.groesse}"` : "";
    return `<div class="${k}"${g}>
      ${opt.name != null ? `<div class="ava-name">${esc(opt.name)}</div>` : ""}
      <div class="ava-fig">${opt.platz ? krone(opt.platz) : ""}${svg(i, st)}${opt.haken ? '<span class="ava-haken" aria-label="hat geantwortet">✓</span>' : ""}</div>
    </div>`;
  }

  window.Avatare = { liste: AVATARE, svg, html, anzahl: AVATARE.length, esc };
})();
