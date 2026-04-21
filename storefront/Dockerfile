FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo "=== /app ===" && ls -la /app && echo "=== /app/lib ===" && ls -la /app/lib 2>&1 || echo "NO LIB" && echo "=== /app/components ===" && ls -la /app/components 2>&1 || echo "NO COMPONENTS" && echo "=== /app/app ===" && ls /app/app 2>&1 && echo "=== tsconfig ===" && cat /app/tsconfig.json 2>&1 || echo "NO TSCONFIG"
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/next.config.mjs ./
EXPOSE 8000
CMD ["npm", "run", "start"]
