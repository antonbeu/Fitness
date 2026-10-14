# Life & Fitness App — Zwischenstand

## Umbau 2026-10-14: helles Design, Builder, Statistiken, Trainingshistorie

- Neues helles, schlichtes Design (Systemschrift, ein blauer Akzent, flache weiße Karten, iOS-artige Tab-Leiste mit 3 Tabs). Habits entfernt.
- Größeres, menschlicheres Körpermodell (Polygone aus react-body-highlighter, MIT).
- Workout-Builder mit Drag & Drop (Katalog → Warenkorb) und Live-Analyse (Muskelgruppen, was fehlt).
- Statistik je Übung mit Verlaufsdiagramm (`/training/exercises/[id]`), „Letztes Mal“ im Training, Zeit-Übungen (Plank) in Sekunden.
- Trainingsbuch des Vaters (18 Tage, 239 Sätze) importiert; Details und offene Fragen in MEMORY.md Abschnitt 4b.


Stand: 2026-10-04. Diese Datei fasst den aktuellen Projektstand zusammen, damit nach einer Context-Kompression (oder in einer neuen Session) nahtlos weitergearbeitet werden kann.

## Umbau Oktober 2026: Version für den Vater (aktueller Stand, hat Vorrang vor älteren Abschnitten unten)

Die App wird jetzt vom Vater genutzt (kleines Gym, nur Basisübungen). Änderungen:
- **Ernährung komplett entfernt** (Seiten, Komponenten, OFF-Client). Die Prisma-Tabellen `Food`/`MealEntry` existieren noch im Schema/der DB, werden aber nicht mehr genutzt.
- **Katalog auf 31 Basisübungen reduziert** (kuratierte Liste mit deutschen Namen in `prisma/basics.ts`; `npm run db:import-exercises` importiert nur diese und löscht alle anderen, nicht referenzierten Übungen). Keine Anleitungen/Bilder/Detailseite mehr (Übungsdetailseite, `FavoriteButton`, `lib/training/exercise-images.ts` gelöscht; `instructions`/`images` bleiben leer). Muskel-Map und Favoriten bleiben im Tab „Übungen“. Die übersetzten Anleitungen existieren nur noch im Scratchpad der alten Session, die Rohdaten (EN) weiterhin in `prisma/data/free-exercise-db.json`.
- **Neue UI im Stil von Apple Fitness**: durchgehend dunkel (`dark` auf `<html>`), schwarzer Hintergrund, olivgrüne Karten, Lime-Akzent (`--primary` in `app/globals.css`), große runde Karten, schwebende Tab-Leiste unten (`components/TabBar.tsx`: Workout / Übungen / Verlauf / Habits).
- **Startseite `/` = Workout-Liste**: pro Plan eine Karte mit großem Play-Button (startet Training direkt), „Bearbeiten“, plus Karte „Freies Training“; oben + (neuer Plan) und Abmelden. `/training/workouts` leitet auf `/` um; `/training` ist jetzt „Verlauf“.
- `npm run db:starter-workouts -- <email>` legt „Ganzkörper A/B“ für einen Nutzer an.
- Neuen Nutzer (Vater) anlegen: `npm run create-user -- <email> <passwort> <name>`.
- Offen: Deployment (Railway oder anderer Weg), damit der Vater von seinem Handy zugreifen kann – lokal läuft die App nur auf dem Mac (`npx prisma dev` + `npm run dev`).

---

## Projekt-Speicherort

**Wichtig:** Das Projekt liegt unter `~/Developer/life-fitness-app` — **nicht** mehr in iCloud Drive. Es lag ursprünglich unter `~/Library/Mobile Documents/com~apple~CloudDocs/Claude`, wurde aber verschoben, weil der iCloud-Sync-Dienst (`bird`) versuchte, alle Dateien in `node_modules` laufend zu synchronisieren, was den Dev-Server wiederholt zum Hängen brachte (Turbopack verweigert zudem explizit Symlinks, die aus dem iCloud-Dateisystem herauszeigen). Node-Projekte gehören grundsätzlich nicht in cloud-synchronisierte Ordner.

## Tech-Stack (wie geplant, siehe Architekturplan)

- Next.js 16.3.1 (App Router, TypeScript, Turbopack für Dev, Webpack für Build wegen Serwist)
- Prisma 7.9.1 + PostgreSQL, lokal über `npx prisma dev` (Prisma-eigener lokaler Postgres-Server, kein Docker/Homebrew nötig)
- Auth.js v5 (next-auth beta), Credentials-Provider, JWT-Sessions, **keine öffentliche Registrierung** — Accounts nur per Skript
- Tailwind CSS v4 + shadcn/ui — **Achtung:** diese shadcn-Version nutzt `@base-ui/react` (Base UI), nicht Radix. Siehe "Base-UI-Fallstricke" unten.
- Serwist (`@serwist/next`) für PWA/Service Worker
- Node.js wurde per `nvm` installiert (war auf dem Rechner nicht vorhanden)

## Was ist fertig (v1 komplett, alles im Browser getestet)

### Phase 0 — Fundament
- Next.js/Tailwind/shadcn-Scaffold
- Vollständiges Prisma-Schema (`prisma/schema.prisma`) für alle 3 Module
- Auth.js Credentials-Login, `middleware.ts` → **umbenannt zu `proxy.ts`** (Next.js 16 Konvention), Split-Config-Pattern (`auth.config.ts` für Edge-Middleware, `auth.ts` mit Prisma/bcrypt nur in Node-Kontexten)
- `prisma/create-user.ts` Skript zum Anlegen von Accounts: `npm run create-user -- <email> <passwort> [name]`
- Dashboard-Shell mit 3 Modul-Kacheln, später um echte Live-Daten erweitert

### Phase 1 — Training
- Muskelgruppen-Taxonomie: 17 Gruppen (`prisma/seed.ts`, `npm run db:seed`), abgeleitet aus den Muskelnamen von free-exercise-db (s.u.)
- **Echter Übungskatalog importiert**: 873 Übungen von [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Public Domain / Unlicense). Rohdaten liegen in `prisma/data/free-exercise-db.json` (im Repo, ~1 MB), Import-Skript `prisma/import-exercises.ts` (`npm run db:import-exercises`, idempotent via Upsert). **Zirv.io (`zirv.io/exercise-library`) wurde bewusst NICHT übernommen** — robots.txt sperrt die Datenpfade (`/exercises`, `/muscles`, `/tags`) und die ToS verbieten explizit Reproduktion/Extraktion. Equipment/Kategorie werden ins Deutsche gemappt (`equipmentDe`/`categoryDe` in `import-exercises.ts`). Übungsnamen bleiben Englisch (so allgemein üblich), **Anleitungen (`instructions`) sind jetzt auf Deutsch** — übersetzt von 10 parallelen Hintergrund-Agents (keine externe Übersetzungs-API, keine laufenden Kosten), 868/873 aktualisiert (5 hatten in der Quelle gar keine Anleitung). Bei Bedarf lässt sich das Muster wiederholen: Export-Chunks → Agents übersetzen → Merge-Skript schreibt zurück in die DB (siehe Git-Historie/Vorgehen bei Rückfragen).
- **Favoriten**: `FavoriteExercise`-Tabelle (User↔Exercise, unique), Stern-Toggle in Katalogliste + Detailseite (`app/(dashboard)/training/exercises/actions.ts` → `toggleFavorite`). "Nur Favoriten"-Filter in der Katalog-UI kombinierbar mit Muskelgruppen-Filter und Suche (erfüllt "allgemein UND nach Muskelgruppe").
- **Bild-Anleitungen**: Übungsbilder aus dem free-exercise-db-Repo werden per Hotlinking eingebunden (offiziell von den Maintainern empfohlenes Muster: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<pfad>`, siehe `lib/training/exercise-images.ts`), keine lokale Speicherung von ~1700 Bildern nötig. Thumbnail in der Katalogliste, Bildergalerie auf der neuen Detailseite `app/(dashboard)/training/exercises/[exerciseId]/page.tsx` (Bilder, Muskel-Badges primär/sekundär, nummerierte Anleitung, Favoriten-Button).
- Übungskatalog mit deutlich überarbeiteter 2D-SVG-Muskel-Map (`components/training/MuscleMap.tsx`, Regionsdaten in `lib/training/muscle-regions.ts`) — echte anatomische Formen (Trapez-Kite, Lat-Flügel, Pec-Fächer, tordierte Bizeps/Trizeps-Kapseln, Sixpack-Linien) statt grauer Blöcke, bilaterale Muskeln (Arme/Beine) werden per SVG-`<use>`+Spiegel-Transform gerendert (nur eine Seite wird per Hand definiert). Klick filtert Übungsliste.
- Bei >900 Übungen zeigt der Katalog ohne aktiven Filter nur einen Hinweis statt aller Karten (Performance/Übersicht), Ergebnisse sind auf 60 gedeckelt mit Hinweistext bei mehr Treffern.
- Workout-Builder (`app/(dashboard)/training/workouts/`)
- Trainings-Session-Flow: starten (aus Vorlage oder frei), Sätze mit Gewicht/Wdh. loggen, abschließen (`app/(dashboard)/training/sessions/`)
- Trainingshistorie (Liste + Detail, in `app/(dashboard)/training/page.tsx`)

### Phase 2 — Ernährung
- Open-Food-Facts-Client (`lib/nutrition/off-client.ts`) — Suche + Barcode-Lookup, eigener User-Agent, **live getestet, funktioniert**
- Cache-on-read: OFF-Produkte werden bei Auswahl in lokale `Food`-Tabelle geschrieben
- Essenstagebuch mit Tagesnavigation, Mahlzeiten-Gruppierung, Tages-Makro-Summen (`app/(dashboard)/nutrition/`)
- Eigene Lebensmittel anlegen (`app/(dashboard)/nutrition/foods/new/`)
- Einheiten-Umrechnung (`lib/nutrition/convert.ts`)

### Phase 3 — Habits
- CRUD (Boolean- und Numerisch-Typ), Archivieren/Löschen (`app/(dashboard)/habits/`)
- Tägliche Checkliste
- Historie + automatisch berechneter Streak (`lib/habits/streak.ts`)

### Phase 4 — PWA/Polish (größtenteils fertig)
- `app/manifest.ts`, dynamisch generierte Icons via `next/og` `ImageResponse` (`lib/icon.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`, `app/icons/{192,512,512-maskable}/route.tsx`) — **verifiziert**: Manifest + Icons werden korrekt ausgeliefert
- Service Worker (`app/sw.ts`, Serwist) — Build erzeugt `public/sw.js` korrekt, Server liefert ihn mit richtigem Content-Type. **Echte Registrierung im Browser konnte nicht verifiziert werden** — das genutzte automatisierte Test-Tool blockiert Service-Worker-Registrierung generell (auch ein triviales Test-SW schlägt dort fehl). Sollte auf einem echten Gerät/Browser geprüft werden.
- Dashboard zeigt jetzt echte Live-Daten (letztes Training, heutige Kalorien, Habit-Status heute)
- Mobile-Layout bei 375px Breite geprüft — überall sauber. Ein Auswahl-Dropdown (Base-UI-Select) reagierte im Test-Tool nicht auf simulierte Maus-Klicks im Touch-Modus, aber nachweislich korrekt auf echte Touch-Pointer-Events — vermutlich ein Tool-Artefakt, kein App-Bug. Auf echtem Handy gegenprüfen.
- `npm run build` läuft fehlerfrei durch (20 Routen)

## Noch offen

1. **Railway-Deployment** — auf Nutzerwunsch verschoben. Plan steht (siehe Architekturplan): Postgres-Service + Web-Service, `AUTH_SECRET`/`AUTH_URL`/`DATABASE_URL`/`OFF_USER_AGENT` als Env-Vars, Pre-Deploy-Command `npx prisma migrate deploy`, Deploy über GitHub-Repo (Nutzerpräferenz).
2. **Git-Commits** — Repo ist mit `git init` initialisiert, aber es existiert noch **kein einziger Commit**. Nutzer wollte das erst nach eigenem Antesten.
3. ~~Echter Übungskatalog~~ — erledigt, siehe Phase 1 (873 Übungen von free-exercise-db importiert).
4. ~~Muskel-Map-Artwork~~ — erledigt, anatomisch differenzierte SVG-Formen statt Blöcke (siehe Phase 1). Könnte bei Bedarf noch weiter verfeinert werden (z.B. feinere Bezier-Kurven, Schattierung), aktuell aber ein klarer Fortschritt gegenüber der ersten Version.
5. Exercise-Picker-Dropdowns (Workout-Builder, Session-Logger) sind jetzt 873 Einträge lang — funktional (scrollbar), aber ohne Such-/Filterfunktion im Dropdown selbst. Wäre ein sinnvolles nächstes Polish-Item.
6. Kleinere Politur, nicht angefasst: Toasts bei Mutationen (sonner ist installiert & im Layout eingebunden, aber noch nirgends per `toast()` genutzt).
7. **Migrations-Historie ist nicht mehr sauber**: Das `FavoriteExercise`-Schema-Update (+ `Exercise.images`) wurde per `prisma db push` eingespielt, nicht per `prisma migrate dev`, weil die Shadow-Database von `npx prisma dev` kaputt war (`type "BodyRegion" already exists`, auch nach manuellem Reset der Shadow-DB). Bevor Railway-Deployment ansteht (braucht `prisma migrate deploy`, was eine saubere Migrationshistorie voraussetzt), muss entweder die Shadow-DB repariert werden oder die Migration nachträglich per `prisma migrate dev` (ggf. mit `--create-only` und Diff gegen den aktuellen DB-Stand) sauber nachgezogen werden.

## Wichtige Gotchas für die Weiterarbeit

- **Base UI statt Radix**: `Button` nutzt `render={<Link .../>}` + `nativeButton={false}` statt `asChild`. `Select`'s `SelectValue` übernimmt das Label **nicht** automatisch vom `SelectItem` — braucht `children`-Render-Funktion: `<SelectValue>{(value) => ...}</SelectValue>`. `onValueChange` liefert `string | null`, State-Setter entsprechend absichern.
- **Serwist + Turbopack**: Next 16 nutzt Turbopack standardmäßig auch für `next build`, Serwist unterstützt das nicht. `package.json` → `"build": "next build --webpack"`. `next.config.ts` braucht explizit `turbopack: {}`, sonst meckert Turbopack im Dev-Modus über die vorhandene Webpack-Config. `app/sw.ts` braucht `/// <reference lib="webworker" />` am Dateianfang gegen TS-Fehler. Service Worker wird über `<SerwistProvider>` in `app/layout.tsx` registriert (nicht automatisch).
- **Auth.js in Produktion**: `next start` wirft `UntrustedHost`, wenn `AUTH_URL` nicht gesetzt ist (in Dev nicht nötig). Lokal für Prod-Test: `AUTH_URL="http://localhost:3000"` in `.env`. Auf Railway muss das auf die echte Domain zeigen.
- **Lokale DB**: `npx prisma dev` startet einen persistenten lokalen Postgres-Server (läuft als eigener Hintergrundprozess, unabhängig vom Projektordner). `npx prisma dev ls` zeigt Status/Connection-String. `.env` → `DATABASE_URL` zeigt darauf.
- **Login-Testaccount**: `tonibeule@web.de` (lokal; Passwort steht bewusst nicht im Repo, neu setzen mit `npm run create-user -- tonibeule@web.de <passwort> <name>`).

## Wie lokal starten

```bash
cd ~/Developer/life-fitness-app
npm run dev
# App unter http://localhost:3000, Login siehe oben
```

Falls die lokale DB nicht läuft: `npx prisma dev` (im Projektordner).
