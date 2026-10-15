# App veröffentlichen

Zwei Wege: **Railway** (empfohlen, kein eigener Server nötig) oder ein **eigener Server mit Docker**. Beide nutzen dasselbe `Dockerfile`; `scripts/start.sh` richtet beim Start Datenbank, Übungskatalog und auf Wunsch das Konto ein.

## Variante 1: Railway

Voraussetzung: der Code liegt in einem (privaten) GitHub-Repository.

1. **Neues Projekt:** In Railway „New Project“ → „Deploy from GitHub repo“ → das Repository wählen. Railway erkennt das `Dockerfile` selbst (`railway.json` liegt bei).
2. **Datenbank:** Im Projekt „New“ → „Database“ → „Add PostgreSQL“.
3. **Variablen** beim App-Dienst (Tab „Variables“):

   | Variable | Wert |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Verweis auf die Datenbank; der Name vor dem Punkt ist der Name des Postgres-Dienstes) |
   | `AUTH_SECRET` | zufälliger Schlüssel, z. B. mit `openssl rand -base64 32` erzeugen |
   | `BOOTSTRAP_USER_EMAIL` | Benutzername des Vaters (E-Mail oder beliebiger Name) |
   | `BOOTSTRAP_USER_PASSWORD` | sein Passwort |
   | `BOOTSTRAP_USER_NAME` | Vorname für die Begrüßung |
   | `BOOTSTRAP_IMPORT_HISTORY` | `1` (spielt sein handschriftliches Trainingsbuch ein) |

4. **Adresse:** Beim App-Dienst unter „Settings“ → „Networking“ → „Generate Domain“. Die Adresse wird automatisch als `AUTH_URL` verwendet. Wurde sie erst nach dem ersten Start erzeugt, den Dienst einmal neu deployen.
5. **Aufräumen nach dem ersten erfolgreichen Start:** `BOOTSTRAP_USER_PASSWORD`, `BOOTSTRAP_USER_EMAIL` und `BOOTSTRAP_IMPORT_HISTORY` wieder löschen. Sonst wird bei jedem Start das Passwort zurückgesetzt und das Trainingsbuch neu eingespielt.
6. Die Adresse auf dem Handy öffnen, anmelden, im Browser „Zum Home-Bildschirm“ wählen.

Weitere Konten (oder Passwort neu setzen): Variablen `BOOTSTRAP_USER_*` für den neuen Namen setzen, deployen, danach wieder löschen.

Datensicherung: Railway kann Postgres-Backups (je nach Tarif). Alternativ ein Dump über die öffentliche Datenbank-Adresse mit `pg_dump`.

## Variante 2: eigener Server mit Docker

### Voraussetzungen

- Linux-Server mit **Docker** und dem **Compose-Plugin** (`docker compose version` muss funktionieren), ca. 1 GB RAM und 3 GB freier Platz für das Image.
- Eine **Domain oder Subdomain**, die auf die IP des Servers zeigt (z. B. `training.example.de`). HTTPS ist Pflicht, sonst funktionieren Login-Cookies und die Installation auf dem Handy („Zum Home-Bildschirm“) nicht.
- Freie Ports **80 und 443** (sonst eigenen Reverse-Proxy benutzen, siehe unten).

### Erstinstallation

```bash
git clone <repo-url> training && cd training      # oder Projektordner hochladen
cp deploy.env.example deploy.env
nano deploy.env                                     # Passwort, Schlüssel, Domain eintragen
docker compose --env-file deploy.env --profile caddy up -d --build
```

Beim Start legt die App Tabellen und Übungskatalog selbst an. Danach einen Account anlegen (Accounts gibt es nur so, keine Registrierung in der App):

```bash
docker compose --env-file deploy.env exec app npm run create-user -- vater@example.de 'EIN-PASSWORT' 'Name'
docker compose --env-file deploy.env exec app npm run db:import-history -- vater@example.de   # bisherige Trainings
```

Danach ist die App unter der Domain erreichbar.

### Betrieb

- **Update:** neuen Code holen (`git pull`), dann den `docker compose … up -d --build`-Befehl von oben wiederholen. Daten bleiben erhalten.
- **Passwort zurücksetzen:** `create-user` mit derselben E-Mail und neuem Passwort erneut ausführen.
- **Backup (täglich per Cron empfohlen):**
  `docker compose --env-file deploy.env exec -T db pg_dump -U fitness fitness | gzip > backup-$(date +%F).sql.gz`
- **Logs:** `docker compose --env-file deploy.env logs -f app`

### Eigener Reverse-Proxy (nginx, Traefik …)

Ohne `--profile caddy` starten. Die App lauscht dann nur auf `127.0.0.1:3000`; der eigene Proxy leitet die Domain per HTTPS dorthin weiter. `AUTH_URL` muss weiterhin die öffentliche https-Adresse sein.

## Hinweis zum Datenschutz

Wer den Server betreibt, kann technisch die Trainingsdaten in der Datenbank lesen. Passwörter sind nur als bcrypt-Hash gespeichert.
