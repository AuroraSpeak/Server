FROM node:20-alpine

WORKDIR /app

# Installiere pnpm
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# Kopiere package.json und pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Installiere Abhängigkeiten
RUN pnpm install

# Kopiere den Rest des Codes
COPY . .

# Exponiere den Port
EXPOSE 3000

# Starte den Entwicklungsserver mit Host-Binding
CMD ["pnpm", "dev", "--host", "0.0.0.0"] 