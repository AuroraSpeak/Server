# AuraSpeak Deployment-Dokumentation

## Übersicht

AuraSpeak wird mit Docker und Docker Compose deployed. Die Anwendung besteht aus mehreren Containern, die über ein Docker-Netzwerk kommunizieren.

## Voraussetzungen

- Docker 20.10 oder höher
- Docker Compose 2.0 oder höher
- Mindestens 4GB RAM
- Mindestens 20GB Festplattenspeicher

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/yourusername/auraspeak.git
cd auraspeak
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# Bearbeiten Sie die .env Datei mit Ihren Einstellungen
```

### 3. Docker-Container starten

```bash
docker compose up -d
```

## Container

### Frontend (nextapp-dev)

- Port: 3000
- Image: server-nextapp-dev
- Volumes:
  - ./frontend:/app
  - /app/node_modules
  - /app/.pnpm-store
  - /app/.next

### Backend

- Port: 8080
- Image: server-backend
- Volumes:
  - ./backend:/app
  - /app/tmp

### PostgreSQL

- Port: 5432
- Image: postgres:16-alpine
- Volumes:
  - postgres-data:/var/lib/postgresql/data

### PgAdmin

- Port: 5050
- Image: dpage/pgadmin4
- Volumes:
  - pgadmin-data:/var/lib/pgadmin

## Netzwerk

Alle Container sind im `app-network` verbunden:

```yaml
networks:
  app-network:
    driver: bridge
```

## Volumes

Persistente Daten werden in Docker-Volumes gespeichert:

```yaml
volumes:
  postgres-data:
  pgadmin-data:
```

## Umgebungsvariablen

### Frontend

```env
NODE_ENV=development
VITE_API_URL=http://localhost:8080
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
VITE_DEV_SERVER_HOST=0.0.0.0
VITE_DEV_SERVER_PORT=3000
```

### Backend

```env
PORT=8080
JWT_SECRET=your-jwt-secret
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auraspeak
ALLOWED_ORIGINS=http://localhost:3000
GO_ENV=development
```

### PostgreSQL

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auraspeak
```

### PgAdmin

```env
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

## Wartung

### Container verwalten

```bash
# Container starten
docker compose up -d

# Container stoppen
docker compose down

# Container neu starten
docker compose restart

# Logs anzeigen
docker compose logs -f
```

### Datenbank-Backup

```bash
# Backup erstellen
docker exec -t server-postgres-1 pg_dump -U postgres auraspeak > backup.sql

# Backup wiederherstellen
docker exec -i server-postgres-1 psql -U postgres auraspeak < backup.sql
```

### Updates

```bash
# Images aktualisieren
docker compose pull

# Container mit neuen Images neu starten
docker compose up -d
```

## Monitoring

### Container-Status

```bash
docker compose ps
```

### Ressourcennutzung

```bash
docker stats
```

### Logs

```bash
# Alle Logs
docker compose logs

# Frontend-Logs
docker compose logs nextapp-dev

# Backend-Logs
docker compose logs backend

# Datenbank-Logs
docker compose logs postgres
```

## Fehlerbehebung

### Container-Logs prüfen

```bash
docker compose logs -f [service-name]
```

### Container neu starten

```bash
docker compose restart [service-name]
```

### Container entfernen und neu erstellen

```bash
docker compose rm -f [service-name]
docker compose up -d [service-name]
```

### Datenbank zurücksetzen

```bash
docker compose down -v
docker compose up -d
```

## Produktions-Deployment

### Vorbereitung

1. Umgebungsvariablen anpassen
2. SSL-Zertifikate konfigurieren
3. Backup-Strategie implementieren
4. Monitoring einrichten

### Deployment

```bash
# Produktions-Images bauen
docker compose -f docker-compose.prod.yml build

# Container starten
docker compose -f docker-compose.prod.yml up -d
```

### Sicherheit

- Firewall-Regeln konfigurieren
- SSL/TLS einrichten
- Regelmäßige Updates durchführen
- Backup-Strategie implementieren

## Skalierung

### Horizontale Skalierung

```bash
# Backend-Service skalieren
docker compose up -d --scale backend=3
```

### Load Balancing

- Nginx als Reverse Proxy
- Container-Orchestrierung (optional)

## Backup & Recovery

### Backup-Strategie

1. Datenbank-Backup
2. Volumes-Backup
3. Konfigurations-Backup

### Recovery-Prozess

1. Backup wiederherstellen
2. Container neu starten
3. Datenbank-Migrationen ausführen

## Monitoring & Logging

### Prometheus & Grafana

- Metriken sammeln
- Dashboards erstellen
- Alerts konfigurieren

### Logging

- Strukturiertes Logging
- Log-Rotation
- Log-Analyse 