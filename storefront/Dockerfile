FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
# Base Next.js runtime artefacts
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/next.config.mjs ./
# Payload CLI requires these at runtime (tsconfig path resolution + config graph):
# `payload migrate` reads tsconfig.json -> payload.config.ts -> every imported collection/global.
# Without them the CLI crashes with "Cannot read properties of null (reading 'config')"
# because getTSConfigPaths() fails before the config is even loaded.
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/payload.config.ts ./
COPY --from=build /app/payload-types.ts ./
COPY --from=build /app/collections ./collections
COPY --from=build /app/globals ./globals
COPY --from=build /app/blocks ./blocks
COPY --from=build /app/scripts ./scripts
# Entrypoint runs idempotent migrate+bootstrap then hands off to `next start`.
# Both inner steps short-circuit on repeat runs so container restarts are safe.
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 8000
CMD ["./docker-entrypoint.sh"]
