# Produktions-Image: baut die App und startet sie; scripts/start.sh richtet beim Start die Datenbank ein.
FROM node:24-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# "npm ci" führt postinstall (prisma generate) aus und braucht dafür Schema + Config.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# Platzhalter-URL nur für diese Build-Schritte (wird nicht ins Image eingebrannt);
# zur Laufzeit kommt die echte DATABASE_URL von Railway bzw. docker-compose.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm ci

COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
