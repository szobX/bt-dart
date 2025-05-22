#!/bin/bash

if [ ! -d "/app/node_modules" ]; then
  echo "Start: pnpm i"
  cd /app
  pnpm i
fi
if [ ! -d "/app/.output" ]; then
  echo "Start: pnpm build"
  cd /app
  pnpm build
fi

pm2-runtime start ecosystem.config.js --only abele-front