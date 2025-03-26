# 🚧 Vollständiges Setup der Entwicklungsumgebung (Next.js & TypeScript)

Dieses Dokument erklärt alle Schritte für eine vollständige Entwicklungsumgebung mit Next.js, TypeScript inklusive Monitoring, Logging und Fehlertracking.

---

## 🛠️ Voraussetzungen

- **Docker & Docker Compose** installiert.
- Ports frei: `3000`, `5432`, `5050`, `8000`, `9090`, `4000`, `3100`.

---

## 🚀 Schritt-für-Schritt-Startanleitung

### Schritt 1: Umgebungsvariablen

Kopiere `.env.example` zu `.env` und passe die Werte an:

```bash
NODE_ENV=development

POSTGRES_USER=voiceuser
POSTGRES_PASSWORD=securepassword
POSTGRES_DB=voicedb

PGADMIN_DEFAULT_EMAIL=admin@voiceapp.com
PGADMIN_DEFAULT_PASSWORD=pgadminpassword

GLITCHTIP_SECRET_KEY=your-glitchtip-secret-key
DATABASE_URL="postgres://voiceuser:securepassword@postgres:5432/voicedb?connect_timeout=300"
```

### Schritt 3: Docker-Compose Umgebung starten

```bash
docker-compose down --remove-orphans
docker-compose build nextapp-dev
docker-compose up -d postgres pgadmin nextapp-dev glitchtip prometheus grafana loki
```

### Schritt 4: Prisma-Datenbank initialisieren

Generiere den Prisma-Client und führe Migrationen **innerhalb des Containers** aus:

```bash
docker-compose exec nextapp-dev pnpm prisma generate
docker-compose exec nextapp-dev pnpm prisma migrate dev
```

### Schritt 5: Logging mit Loki (TypeScript) einrichten

Installiere Winston und Loki:

```bash
pnpm add winston winston-loki @types/winston
```

Erstelle eine Datei `utils/logger.ts`:

```typescript
import winston from 'winston';
import LokiTransport from 'winston-loki';

const logger = winston.createLogger({
  transports: [
    new LokiTransport({ host: 'http://loki:3100' }),
    new winston.transports.Console(),
  ],
});

export default logger;
```

### Schritt 6: Fehlertracking mit GlitchTip (TypeScript)

Installiere den GlitchTip-Client:

```bash
pnpm add @sentry/nextjs
```

In `next.config.mjs` einbinden:

```typescript
import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig({
  // deine Next.js-Konfiguration
}, { silent: true });
```

Erstelle Konfigurationsdateien `sentry.client.config.ts` und `sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'http://<dsn>@localhost:8000/<projekt-id>',
  tracesSampleRate: 1.0,
});
```

---

## 📌 Alle Dienste im Überblick

| Dienst          | URL                                  | Beschreibung                   |
|-----------------|--------------------------------------|--------------------------------|
| **Next.js DEV** | http://localhost:3000                | Dev-App (Hot Reloading aktiv)  |
| PostgreSQL      | localhost:5432                       | Entwicklungs-Datenbank         |
| pgAdmin         | http://localhost:5050                | GUI für Postgres               |
| GlitchTip       | http://localhost:8000                | Fehlertracking                 |
| Prometheus      | http://localhost:9090                | Monitoring-Server              |
| Grafana         | http://localhost:4000                | Monitoring-Dashboard           |
| Loki (Logging)  | http://localhost:3100                | Log-Management                 |

---

## 📊 Grafana Monitoring-Dashboard konfigurieren

1. Öffne Grafana: [http://localhost:4000](http://localhost:4000)
2. Login (Standard User: `admin`, Passwort beim ersten Login festlegen).
3. Datenquellen hinzufügen:
   - **Prometheus:** `http://prometheus:9090`
   - **Loki:** `http://loki:3100`
4. Dashboards erstellen:
   - CPU-Auslastung: `rate(process_cpu_seconds_total[5m])`
   - Logs (Loki): `{job="nextapp-dev"}`

---

## 🎯 **Empfohlene nächste Schritte:**

- Erstelle und verwalte Datenbank-Schemas mit Prisma.
- Richte spezifische Grafana-Dashboards ein.
- Nutze Logging & Fehlertracking aktiv für kontinuierliche Qualitätskontrolle.

