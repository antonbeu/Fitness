# App auf einem eigenen Server betreiben

Für die Person, die den Server betreibt. Die App läuft als Docker-Container zusammen mit einer PostgreSQL-Datenbank.

## Voraussetzungen

- Linux-Server mit **Docker** und dem **Compose-Plugin** (`docker compose version` muss funktionieren), ca. 1 GB RAM und 3 GB freier Platz für das Image.
- Eine **Domain oder Subdomain**, die auf die IP des Servers zeigt (z. B. `training.example.de`). HTTPS ist Pflicht, sonst funktionieren Login-Cookies und die Installation auf dem Handy („Zum Home-Bildschirm“) nicht.
- Freie Ports **80 und 443** (sonst eigenen Reverse-Proxy benutzen, siehe unten).

## Erstinstallation

```bash
git clone <repo-url> training && cd training      # oder Projektordner hochladen
cp deploy.env.example deploy.env
nano deploy.env                                     # Passwort, Schlüssel, Domain eintragen
docker compose --env-file deploy.env --profile caddy up -d --build
```

Beim ersten Start legt die App die Datenbanktabellen selbst an. Danach einmalig die Grunddaten einspielen und einen Account anlegen (Accounts gibt es nur so, keine Registrierung in der App):

```bash
docker compose --env-file deploy.env exec app npm run db:seed
docker compose --env-file deploy.env exec app npm run db:import-exercises
docker compose --env-file deploy.env exec app npm run create-user -- vater@example.de 'EIN-PASSWORT' 'Name'
docker compose --env-file deploy.env exec app npm run db:import-history -- vater@example.de   # bisherige Trainings
```

Danach ist die App unter der Domain erreichbar.

## Betrieb

- **Update:** neuen Code holen (`git pull`), dann den `docker compose … up -d --build`-Befehl von oben wiederholen. Daten bleiben erhalten.
- **Passwort zurücksetzen:** `create-user` mit derselben E-Mail und neuem Passwort erneut ausführen.
- **Backup (täglich per Cron empfohlen):**
  `docker compose --env-file deploy.env exec -T db pg_dump -U fitness fitness | gzip > backup-$(date +%F).sql.gz`
- **Logs:** `docker compose --env-file deploy.env logs -f app`

## Eigener Reverse-Proxy (nginx, Traefik …)

Ohne `--profile caddy` starten. Die App lauscht dann nur auf `127.0.0.1:3000`; der eigene Proxy leitet die Domain per HTTPS dorthin weiter. `AUTH_URL` muss weiterhin die öffentliche https-Adresse sein.

## Hinweis zum Datenschutz

Wer den Server betreibt, kann technisch die Trainingsdaten in der Datenbank lesen. Passwörter sind nur als bcrypt-Hash gespeichert.
