FROM node:20-alpine AS builder
WORKDIR /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install --no-frozen-lockfile
RUN npx prisma generate
COPY . .
RUN pnpm run build

FROM node:20-alpine
WORKDIR /app

# Install Chromium and necessary dependencies for Puppeteer PDF rendering
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 4000
CMD ["pnpm", "run", "start:prod"]
