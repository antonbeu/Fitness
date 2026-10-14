# Produktions-Image: baut die App und startet sie; beim Start werden Datenbank-Migrationen angewendet.
FROM node:24-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# "npm ci" führt postinstall (prisma generate) aus und braucht dafür Schema + Config.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# Platzhalter nur für den Build; zur Laufzeit kommt die echte URL aus docker-compose.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
