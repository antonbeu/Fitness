#!/bin/sh
# Startskript des Containers (Railway und docker compose).
# Richtet beim Start alles Nötige idempotent ein und startet dann die App.
set -e

# Auf Railway die öffentliche Adresse automatisch als AUTH_URL nehmen, falls nicht gesetzt.
if [ -z "$AUTH_URL" ] && [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
  export AUTH_URL="https://$RAILWAY_PUBLIC_DOMAIN"
fi

npx prisma migrate deploy
npm run db:seed
npm run db:import-exercises

# Optional: Konto beim Start anlegen. Nach dem ersten erfolgreichen Start die beiden
# BOOTSTRAP_USER_*-Variablen wieder löschen (sonst wird das Passwort bei jedem Start neu gesetzt).
if [ -n "$BOOTSTRAP_USER_EMAIL" ] && [ -n "$BOOTSTRAP_USER_PASSWORD" ]; then
  npm run create-user -- "$BOOTSTRAP_USER_EMAIL" "$BOOTSTRAP_USER_PASSWORD" "${BOOTSTRAP_USER_NAME:-Nutzer}"
  if [ "$BOOTSTRAP_IMPORT_HISTORY" = "1" ]; then
    npm run db:import-history -- "$BOOTSTRAP_USER_EMAIL"
  fi
fi

exec npm start
