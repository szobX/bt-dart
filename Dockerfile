
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
#
RUN pnpm install 

# Skopiuj resztę kodu aplikacji
COPY . .

# Zbuduj aplikację Nuxt 3 za pomocą skryptu pnpm
# Zakładając, że masz skrypt "build" w swoim package.json, np. "build": "nuxt build"
RUN pnpm build

# --- ETAP 2: Uruchomienie aplikacji (Runner) ---
# Użyj tego samego lekkiego obrazu Node.js
FROM node:20-alpine AS runner

WORKDIR /app

# Ustaw zmienną środowiskową NODE_ENV na production
ENV NODE_ENV=production

# Konfiguracja hosta i portu dla serwera Nuxt
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Skopiuj TYLKO zbudowaną aplikację (katalog .output) z etapu "builder"
COPY --from=builder /app/.output ./.output

# Wystaw port, na którym działa aplikacja Nuxt
EXPOSE 3000

# Komenda do uruchomienia serwera produkcyjnego Nuxt 3
# Serwer znajduje się w .output/server/index.mjs
CMD ["node", ".output/server/index.mjs"]