# MEMORY – Projektgedächtnis „Training“-App

Konsolidierter Überblick über alles, was in diesem Projekt entschieden, gebaut und gelernt wurde. Stand: 2026-10-14. Für den Detailverlauf siehe zusätzlich `STATUS.md`.

## 1. Worum es geht

- Persönliche Web-App (PWA), ursprünglich als „Life & Fitness“-App für Anton (Training, Ernährung, Habits).
- **Aktuell umgebaut für Antons Vater**: kleines Gym, nur Basisübungen und die Geräte aus seinem Gym, kein Ernährungstracking, keine Habits. Oberfläche seit 2026-10-14 **hell**; der frühere dunkle Apple-Fitness-Look wirkte Anton „zu sehr nach AI-Slop“. Aktueller Stil (nach Referenzbild von Anton, aber „nicht zu bunt“, keine neuen Features): Sand als Grund, weiße Karten mit sehr großen Rundungen, Pastellkacheln in Salbei/Sand/Ton (`bg-tile-sage|sand|clay` aus `globals.css`), tiefes Waldgrün als Akzent (`--primary`), schwarze Pillen-Buttons für „Starten“ (Button-Variante `ink`), Pillen als Umschalter, runde Systemschrift (`ui-rounded`), Tab-Leiste mit abgerundeter Oberkante und Salbei-Pille für den aktiven Tab, Diagramme mit weicher Kurve und Farbverlauf (`lib/smooth-path.ts`).
- Sprache der UI: Deutsch. Der Nutzer schreibt Deutsch; Antworten auf Deutsch.

## 2. Wo was liegt

- **Projektordner: `~/Developer/life-fitness-app`** (nicht mehr in iCloud Drive!). Grund: iCloud-Sync (`bird`) hat `node_modules` dauernd synchronisiert und den Dev-Server hängen lassen; Turbopack verweigert außerdem Symlinks aus iCloud heraus. Node-Projekte nie in cloud-synchronisierte Ordner legen.
- Git: initialisiert, Branch `main`, **noch kein einziger Commit** (Nutzer wollte erst selbst testen). Nur committen, wenn er es verlangt.
- Node läuft über nvm (`export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` vor npm/npx in der Bash-Shell nötig).

## 3. Tech-Stack

- Next.js 16.3.1 (App Router, TS, Turbopack im Dev, Webpack für Build), React 19
- Prisma 7.9.1 + PostgreSQL, lokal über `npx prisma dev` (eigener Hintergrund-Daemon, Port 51214, kein Docker/Homebrew). Prisma 7 braucht Driver-Adapter (`@prisma/adapter-pg`, siehe `lib/db.ts`); generierter Client unter `lib/generated/prisma`.
- Auth.js v5 (next-auth beta), Credentials (Anmeldung mit Benutzername ODER E-Mail, Groß-/Kleinschreibung egal; das Feld `User.email` darf beliebigen Text enthalten), JWT-Sessions, **keine Registrierung** – Accounts nur per Skript. Split-Config: `auth.config.ts` (Edge/Proxy) + `auth.ts` (Node, Prisma/bcrypt). `middleware.ts` heißt in Next 16 `proxy.ts`.
- Tailwind v4 + shadcn/ui auf **Base UI** (nicht Radix); @dnd-kit (core/sortable) für Drag & Drop
- Serwist (`@serwist/next`) für PWA/Service Worker

## 4. Aktueller Funktionsumfang

- **Training (`/`)**: Karte je Workout mit Name, Anzahl Übungen, trainierten Körperbereichen, „Zuletzt vor X Tagen“, Buttons „Starten“ / „Bearbeiten“; „Neues Workout zusammenstellen“, „Freies Training“, Abmelden unten.
- **Workout-Builder** (`/training/workouts/new`, `/training/workouts/[id]`, `components/training/WorkoutBuilder.tsx`): Katalog (Reiter „Alle Übungen“ / „Meine Übungen“ = Favoriten + Übungen mit ≥ 2 Trainings, nach Häufigkeit sortiert; Suche + Bereichsfilter) und „Warenkorb“. Übungen per **Drag & Drop** (dnd-kit; Maus sofort, Touch nach 200 ms Halten) oder per +-Button hinzufügen, Position beim Ablegen auf eine Zeile, Umsortieren per Griff. Pro Zeile Sätze/Wdh./kg. **Analyse** live: Körpergrafik mit Auslastung, Chips je Bereich (Brust, Rücken, Schultern, Arme, Bauch, Beine, Gesäß) mit „trainiert / nebenbei / fehlt“ plus Satz, was fehlt; Klick auf einen fehlenden Bereich filtert den Katalog (`lib/training/coverage.ts`). Mobil: Tabs „Übungen | Mein Workout“ + feste Leiste unten als Ablageziel; Desktop: zwei Spalten. Tab-Leiste ist im Builder ausgeblendet. Tab-Leiste sonst: Training, Übungen, Statistik, Verlauf.
- **Session** (`/training/sessions/[id]`): Satz eintragen (kg × Wdh., Felder vorbelegt aus letztem Satz / Letztes Mal / Ziel), „Letztes Mal“ und „Ziel“ je Übung, Link zur Statistik, Übung hinzufügen/entfernen, abschließen. **Zeit-Übungen** (Exercise.category = „Zeit“, z. B. Plank) werden in Sekunden erfasst, Einheit `s`. Wurde zuletzt „kg pro Seite“ (`kg/Seite`) notiert, bleibt die Eingabe in dieser Einheit.
- **Übungen (`/training/exercises`)**: großes, menschlich proportioniertes Körpermodell (Vorder-/Rückansicht, 17 Muskelgruppen, Klick filtert), Suche, Favoriten (Stern, Filter „Favoriten“, kombinierbar), Bestwert je Übung.
- **Übungs-Statistik (`/training/exercises/[exerciseId]`)**: Kacheln (Bestes Gewicht, Geschätztes Maximum nach Epley, Trainings, Gesamtvolumen; bei Zeit-Übungen Bestzeit), Verlaufsdiagramm (eigenes SVG, `ProgressChart.tsx`; Umschalter Höchstgewicht / Max geschätzt / Volumen, bei Zeit: Längste Zeit / Gesamtzeit), Liste aller Trainings, Mini-Körpergrafik der beteiligten Muskeln.
- **Statistik (`/statistik`, eigener Tab)**: Kacheln (Trainings, Sätze, Übungen, letztes Training) und Liste aller Übungen mit Daten: Symbol, Mini-Verlauf (`Sparkline.tsx`), letzter Höchstwert, Veränderung seit dem ersten Training; Suche und Sortierung (Zuletzt / Fortschritt / A–Z); Tipp führt zur Detail-Statistik mit Diagramm (`StatsList.tsx`, `getStatsOverview` in `stats.ts`).
- **Übungs-Symbole** (`components/training/ExerciseIcon.tsx`, Zuordnung Name → Bewegungsmuster in `lib/training/exercise-icons.ts`): 34 flache Piktogramme mit Figur (Akzentfarbe) und Gerät, im Stil eines Anton-Beispielbilds (Lavendelgrau, dunkle Gewichte). Sie erscheinen rechts in den Listen (Katalog, Builder vor dem +), im Warenkorb, im Training und in der Statistik. **Neue Übung = Namen in `kindByName` eintragen**, sonst Standard-Hantel-Symbol.
- **Verlauf (`/training`)**: alle Sessions als Liste.
- **Entfernt**: Ernährung, Habits (Code seit 2026-10-14 weg; die Tabellen `Habit`/`HabitEntry`/`Food`/`MealEntry` liegen evtl. noch in der lokalen DB, siehe Offene Punkte), Anleitungen, Bilder, Dark Mode.
- PWA: Manifest, generierte Icons (blau mit weißem „T“), Service Worker per `SerwistProvider`.

## 4b. Trainingshistorie des Vaters (importiert)

- Quelle: handschriftliches Trainingsbuch, 18 Trainingstage 23.06.–12.10.2026, von Anton als Text geschickt und von Hand in `prisma/data/history.ts` übertragen (Original-Notizen stehen dort als Kommentare). Import: `npm run db:import-history -- <email>` (idempotent; löscht frühere Importe mit der Notiz „Import: handschriftliches Trainingsbuch“ des Nutzers und legt neu an). Im lokalen Testkonto `tonibeule@web.de` bereits importiert; **für den Account des Vaters nach dem Deploy erneut ausführen**.
- Übertragungs-Konventionen (Annahmen, bei Zweifel mit dem Vater klären): „x3“ hinter Gewicht ohne Wiederholungen = 3 Sätze, sonst Regelfall 3 Sätze; `ps` = „pro Seite der Stange“ (Einheit `kg/Seite`, Kurzhanteln in kg je Hantel); Plank etc. in Sekunden; „Abdu/Addu 90x1 95x2“ = 1 Satz 90 kg + 2 Sätze 95 kg; „Beinpresse r50x8x3 L50x8x3“ = je Bein 3 Sätze (6 Sätze); Jahr 2026, Uhrzeit pauschal 18:00 (+02:00).
- **Bewusst nicht importiert**: alles hinter einem „|“ im Original. Laut Anton sind das Notizen des Trainingspartners seines Vaters, nicht dessen eigene Werte (betrifft 02.07. Latzug/Rhomboid/Butterfly, 27.08. Schulterdrücken, 03.09. Bankdrücken). Liste als `SKIPPED` in `history.ts`; die Frage ist damit geklärt.
- Zugeordnete Namen (nicht eindeutig): „Schulterdrücken 20“ am 27.08. → Schulterpresse (Maschine); „Rudern“ → Rudern am Kabelzug; „Lat/Lastzug“ → Latzug (breit); „Waden“ → Wadenheben (stehend); „Bizeps 2,5 + Stange“ → Langhantel-Curls 2,5 kg/Seite; „Schultergürtel“ → Schulterheben (Trapez); „Butterfly Kabel“ → Fliegende am Kabelzug.
- Zusätzliche Geräte/Übungen aus seinem Gym (14 Stück) in `prisma/extra-exercises.ts`, werden von `db:import-exercises` mit angelegt: Butterfly, Fliegende am Kabelzug, Hammer-Curls, Beinheben, Rhomboiden-Maschine, Abduktoren-/Adduktoren-Maschine, Rumpfrotation (Kabelzug, nicht Maschine; von Anton korrigiert), Step-Downs, Seitlicher Unterarmstütz, Schulterpresse (Maschine), Schulterheben, Rudern mit Brustpolster, Dip-Maschine (Schnell; „Dips 35“ = Gewichtsstapel, bestätigt von Anton).

## 5. Wichtige Dateien

- `prisma/schema.prisma` – Datenmodell (User, MuscleGroup, Exercise, ExerciseMuscleGroup, FavoriteExercise, Workout, WorkoutExercise, WorkoutSession, SessionExercise, SetLog, Habit, HabitEntry, Food, MealEntry)
- `prisma/basics.ts` – kuratierte Basisübungen (ID aus free-exercise-db + deutscher Name)
- `prisma/import-exercises.ts` – importiert nur diese Basics aus `prisma/data/free-exercise-db.json` und löscht alle anderen nicht referenzierten Übungen
- `prisma/seed.ts` – 17 Muskelgruppen
- `prisma/seed-starter-workouts.ts` – „Ganzkörper A/B“ für einen Nutzer
- `prisma/create-user.ts` – Nutzer anlegen/Passwort setzen
- `components/TabBar.tsx` – untere Navigation; `app/(dashboard)/layout.tsx` – Layout
- `components/training/MuscleMap.tsx` + `lib/training/body-model.ts` – SVG-Körpermodell aus Muskel-Polygonen (Geometrie aus react-body-highlighter, MIT, im Dateikopf vermerkt; per Einmal-Skript erzeugt und geglättet, nicht von Hand pflegen). Modi: Auswahl (`onSelect`) oder Anzeige (`intensity`)
- `components/training/WorkoutBuilder.tsx`, `lib/training/coverage.ts` – Builder und Analyse; `components/training/ProgressChart.tsx`, `lib/training/stats.ts`, `lib/format.ts` – Statistik/Formatierung (alles in Europe/Berlin)
- `prisma/data/history.ts`, `prisma/import-history.ts`, `prisma/extra-exercises.ts` – Historie und Zusatzübungen
- `app/globals.css` – helles Theme (nur `:root`; `dark:`-Variant bleibt definiert, matcht aber nie)

## 6. Befehle

```bash
cd ~/Developer/life-fitness-app
npx prisma dev -d                 # lokale DB starten (falls "not_running": npx prisma dev ls)
npm run dev                       # http://localhost:3000
npm run build                     # Production-Build (webpack wegen Serwist)
npm run db:seed                   # Muskelgruppen
npm run db:import-exercises       # Basisübungen
npm run db:starter-workouts -- <email>
npm run db:import-history -- <email>   # Trainingsbuch des Vaters
npm run create-user -- <email> <passwort> <name>
```

- Testaccount lokal: `tonibeule@web.de` (Passwort steht bewusst nicht im Repo; neu setzen mit `create-user`).

## 7. Entscheidungen & Begründungen

- **Kein zirv.io-Katalog**: robots.txt sperrt die Datenpfade, ToS verbieten Reproduktion → stattdessen free-exercise-db (Unlicense/Public Domain, 873 Übungen); davon bleiben nur 31 Basics.
- **Keine Offline-Sync, keine Charts/Ziele** in v1 (bewusst weggelassen).
- **Übersetzungen** der Anleitungen wurden per parallelen Agents erzeugt (868/873), sind nach dem Umbau aber nicht mehr in der App.
- **Deployment**: ursprünglich Railway geplant; jetzt Docker-Setup für den Server eines Freundes (siehe Offene Punkte 1).

## 8. Gotchas

- **Base UI**: `Button` mit `render={<Link/>}` + `nativeButton={false}` statt `asChild`; `SelectValue` zeigt das Label nicht automatisch → Render-Funktion nötig; `onValueChange` liefert `string | null`.
- **Serwist + Turbopack**: `build` = `next build --webpack`; `next.config.ts` braucht `turbopack: {}`; `app/sw.ts` beginnt mit `/// <reference lib="webworker" />`; Registrierung über `<SerwistProvider options={{ type: "classic" }}>`. Service Worker ist im Dev deaktiviert.
- **Auth in Prod**: `AUTH_URL` muss gesetzt sein, sonst `UntrustedHost`.
- **Prisma-Client-Cache**: Nach Schema-Änderung `npx prisma generate` und `.next` löschen, sonst fehlen neue Modelle zur Laufzeit.
- **Prozesse**: Port 3000 freimachen mit `lsof -ti :3000 -sTCP:LISTEN | xargs -r kill -9` (`pkill "next dev"` trifft den `next-server` nicht zuverlässig).
- **Test-Browser-Pane**: Service-Worker-Registrierung wird dort blockiert; Klicks im Touch-Modus erreichen Base-UI-Selects nicht (echte Geräte sind nicht betroffen). Mehrfach-Submit-Buttons per Text filtern, nicht `querySelector('button[type=submit]')`.

## 9. Offene Punkte

1. **Hosting**: Railway ist der gewählte Weg (Anton hat einen Account); Alternative: Server eines Freundes per Docker. Vorbereitet: `Dockerfile`, `railway.json`, `scripts/start.sh` (beim Start: `migrate deploy`, Seed, Übungsimport, optional Konto + Historie aus `BOOTSTRAP_USER_*`-Variablen, `AUTH_URL` aus `RAILWAY_PUBLIC_DOMAIN`), `docker-compose.yml` (+ Caddy), Anleitung `DEPLOY.md` (Railway zuerst). Getestet: Build und Start in sauberem Verzeichnis ohne `.env`, Migration auf leerer In-Memory-DB, Start-Skript lokal. **Nie getestet: Docker-Image selbst und Railway** (Docker lokal nicht installiert). Offen: Code nach GitHub (privates Repo; `gh` ist lokal nicht installiert, Anton legt es an oder installiert `gh`), dann Railway-Schritte aus `DEPLOY.md`. Das Konto des Vaters (Login „Lars66“) wird NUR über Railway-Variablen angelegt; sein Passwort steht bewusst nirgends im Repo.
2. **Migrationen**: sauberer Baseline `prisma/migrations/0001_init` (aus dem Schema erzeugt, lokal per `migrate resolve --applied` als angewendet markiert). Habit-Tabellen sind aus der lokalen DB gelöscht (mit Zustimmung des Nutzers, 2026-10-14). Achtung: `npx prisma dev` ist ein PGlite-Server mit EINER Datenbank (`template1`), zweite Datenbanken per `CREATE DATABASE` gehen nicht; neue Migrationen daher mit `prisma migrate diff` erzeugen und das SQL in `@electric-sql/pglite` testen. Seiten, die die DB lesen, ohne Cookies/Auth zu nutzen, brauchen `export const dynamic = "force-dynamic"` (sonst Prerender zur Build-Zeit).
3. **Historie**: „|“-Einträge sind geklärt (Partner-Notizen, weggelassen). Offen bleiben nur die Annahmen aus 4b (v. a. `ps` und Satzzahlen) und die unsicheren Gerätezuordnungen (Schultergürtel, Rudern).
4. Katalog mit dem Vater abgleichen: es gibt noch ~30 Standardübungen, die er nie genutzt hat; evtl. auf „seine“ Geräte reduzieren oder Favoriten nutzen.
5. Drag & Drop per Touch (Halten 200 ms) ist nur im Browser-Pane per Maus getestet, nicht auf einem echten Handy. PWA-Installierbarkeit ebenfalls noch nicht auf echtem Gerät geprüft.
6. Git-Commit steht weiterhin aus (nur auf Wunsch).
