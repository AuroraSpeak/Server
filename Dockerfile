FROM node:18

WORKDIR /app

COPY . .

RUN corepack enable && corepack prepare pnpm@8.6.12 --activate

RUN pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
