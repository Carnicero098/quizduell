# Baumpflege-Quizduell – Einrichtung und Bedienung

## Online stellen (einmalig, ca. 10 Minuten)

Genau wie beim Betriebsbuch: über GitHub zu Netlify. **Nicht per Drag-and-drop
bei Netlify hochladen** – dann fehlt die Speicher-Bibliothek und das Spiel
meldet „Keine Verbindung“.

1. Auf **github.com** oben rechts **+** → **New repository**
   - Name: `quizduell`
   - **Private** auswählen
   - **nicht** „Add a README“ anhaken
   - **Create repository**
2. Claude Bescheid geben – der Ordner `quizduell` ist schon als Git-Ablage
   vorbereitet und wird dann hochgeschoben.
3. Bei **app.netlify.com** → **Add new site** → **Import an existing project**
   → **GitHub** → `quizduell` auswählen → **Deploy**.
   Die Einstellungen kommen aus `netlify.toml`, du musst nichts eintragen.
4. Unter **Site configuration → Change site name** einen Namen vergeben,
   z. B. `baumpflege-quiz` → Adresse: `https://baumpflege-quiz.netlify.app`

Optional: Unter **Environment variables** `QUIZ_PASSWORT` setzen, dann gilt
dieses statt `12345`.

## Ablauf eines Quizabends

1. **Creator** (Passwort): Fragen, Antworten A–D, richtige Antwort, Erklärung
   und Bilder eintragen. Gespeichert wird automatisch. Mit **Quiz sichern**
   lädst du alles samt Bildern als Datei herunter.
2. **Präsentieren** (Passwort) am Beamer/Fernseher öffnen → **Neues Spiel
   starten**. Ein QR-Code erscheint.
3. Alle scannen den Code, wählen Avatar und Namen. Ihre Avatare hüpfen auf
   die Wiese. Wer einen unpassenden Namen wählt: Avatar antippen → entfernen.
4. **Quiz starten** → die Frage erscheint (ohne Zeitlimit).
   **Antworten zeigen** → alle tippen ihre Antwort, es gibt kein Zeitlimit.
   Ein Ring zeigt, wie viele schon geantwortet haben.
5. Wann du willst (der Knopf wippt, sobald alle geantwortet haben): **Auflösen** →
   richtige Antwort, Erklärung, Punkte, die drei Besten.
6. Nach der letzten Frage: **Zur Siegerehrung** → Platz 3, 2, 1 mit Trommelwirbel.

Weiterschalten geht auch mit Leertaste, Enter, Pfeil rechts oder einem
Präsentations-Klicker.

**Punkte:** richtige Antwort 500 Punkte, dazu bis zu 500 Punkte fürs Tempo
(gemessen an der Zeit bis zur Auflösung).
Bei Fragen mit mehreren richtigen Antworten (im Creator mehrere Häkchen) gibt
es nur Punkte, wenn genau alle richtigen gewählt sind.

## Lokal ausprobieren

Läuft die Seite auf `localhost`, spielt sie komplett im Browser (ohne Server).
Mehrere Tabs = mehrere Mitspieler.
