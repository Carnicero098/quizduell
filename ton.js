// Baumpflege-Quizduell — Soundeffekte
//
// Alles wird im Browser erzeugt (Web Audio), es gibt keine Sounddateien.
// Browser spielen erst nach dem ersten Antippen Ton ab — Ton.wecken() hängt
// deshalb an jedem Klick.

(function () {
  let ctx = null;
  let master = null;
  let an = true;
  try { an = localStorage.getItem("quiz-ton") !== "aus"; } catch { /* egal */ }

  function wecken() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function ton(freq, start, dauer, { typ = "sine", laut = 0.3, bis = null, attack = 0.01 } = {}) {
    if (!an || !wecken()) return;
    const t = ctx.currentTime + start;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = typ;
    o.frequency.setValueAtTime(freq, t);
    if (bis) o.frequency.exponentialRampToValueAtTime(bis, t + dauer);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(laut, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dauer + 0.05);
  }

  function rauschen(start, dauer, { laut = 0.2, von = 400, bis = 4000, q = 1 } = {}) {
    if (!an || !wecken()) return;
    const t = ctx.currentTime + start;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dauer));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = q;
    f.frequency.setValueAtTime(von, t);
    f.frequency.exponentialRampToValueAtTime(bis, t + dauer);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(laut, t + dauer * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  const Ton = {
    wecken,
    get an() { return an; },
    umschalten() {
      an = !an;
      try { localStorage.setItem("quiz-ton", an ? "an" : "aus"); } catch { /* egal */ }
      if (an) Ton.klick();
      return an;
    },
    // Tippen auf einen Knopf
    klick() { ton(660, 0, 0.08, { typ: "triangle", laut: 0.15 }); },
    // Antwort gewählt: kurzer Plopp
    plopp() { ton(420, 0, 0.12, { typ: "sine", laut: 0.35, bis: 900 }); },
    // Neuer Mitspieler: Vogelgezwitscher
    zwitschern() {
      ton(2200, 0, 0.09, { laut: 0.12, bis: 3200 });
      ton(2600, 0.11, 0.08, { laut: 0.1, bis: 3600 });
    },
    // Neue Frage: Blätterrauschen
    rauschen() { rauschen(0, 0.6, { laut: 0.25, von: 300, bis: 3000, q: 0.8 }); },
    // Antworten erscheinen
    auftritt() {
      [523, 659, 784].forEach((f, i) => ton(f, i * 0.06, 0.18, { typ: "triangle", laut: 0.18 }));
    },
    // Letzte Sekunden
    tick(hoch) { ton(hoch ? 1200 : 900, 0, 0.05, { typ: "square", laut: 0.06 }); },
    // Zeit um: Holzklotz-Gong
    zeitUm() {
      ton(196, 0, 0.7, { typ: "triangle", laut: 0.4 });
      ton(147, 0, 0.9, { typ: "sine", laut: 0.3 });
    },
    richtig() {
      [784, 988, 1319].forEach((f, i) => ton(f, i * 0.09, 0.3, { typ: "triangle", laut: 0.25 }));
    },
    falsch() {
      ton(330, 0, 0.25, { typ: "sawtooth", laut: 0.12, bis: 300 });
      ton(262, 0.25, 0.45, { typ: "sawtooth", laut: 0.12, bis: 200 });
    },
    // Auflösung im Präsentiermodus
    aufloesung() {
      rauschen(0, 0.25, { laut: 0.15, von: 2000, bis: 6000 });
      [659, 880].forEach((f, i) => ton(f, 0.1 + i * 0.1, 0.35, { typ: "triangle", laut: 0.22 }));
    },
    // Trommelwirbel vor dem Podest
    wirbel(dauer = 1.6) {
      if (!an || !wecken()) return;
      for (let t = 0; t < dauer; t += 0.045) rauschen(t, 0.05, { laut: 0.12 + (t / dauer) * 0.18, von: 180, bis: 220, q: 2 });
    },
    fanfare() {
      const n = [[523, 0, 0.18], [523, 0.2, 0.12], [523, 0.34, 0.12], [698, 0.5, 0.5], [880, 1.0, 0.25], [784, 1.25, 0.25], [1047, 1.5, 0.9]];
      n.forEach(([f, t, d]) => { ton(f, t, d, { typ: "sawtooth", laut: 0.1 }); ton(f / 2, t, d, { typ: "triangle", laut: 0.12 }); });
    }
  };

  window.Ton = Ton;
})();
