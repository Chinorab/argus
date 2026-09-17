# Argus — production image (Next.js standalone). Built on the Nebius AI Cloud VM by docker compose.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S argus && adduser -S argus -G argus
COPY --from=build --chown=argus:argus /app/.next/standalone ./
COPY --from=build --chown=argus:argus /app/.next/static ./.next/static
COPY --from=build --chown=argus:argus /app/public ./public
USER argus
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
