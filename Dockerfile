FROM node:22-bullseye-slim

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev

COPY server ./server
WORKDIR /app/server

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs appuser \
  && chown -R appuser:nodejs /app

USER appuser

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
