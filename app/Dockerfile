# --- ETAP 1: Budowanie aplikacji (Builder) ---
FROM node:20-alpine AS builder 

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
# COPY .npmrc .npmrc # Jeśli .npmrc jest w root/app/

RUN pnpm install --frozen-lockfile

COPY . . 

RUN pnpm build

# --- ETAP 2: Uruchomienie aplikacji (Runner) ---
# ... (reszta taka sama jak w poprzednich przykładach)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]