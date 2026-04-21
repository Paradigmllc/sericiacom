FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ bash

FROM base AS deps
COPY package.json ./
RUN npm install --legacy-peer-deps

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx medusa build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY medusa-config.ts ./
COPY tsconfig.json ./
COPY src ./src
EXPOSE 9000
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
