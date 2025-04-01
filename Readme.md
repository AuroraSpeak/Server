# AuraSpeak

> ⚠️ **ALPHA-VERSION** ⚠️
> 
> Dies ist eine Alpha-Version von AuraSpeak. Die Anwendung befindet sich noch in der Entwicklung und kann instabil sein. Funktionen können sich ändern oder hinzukommen. Bitte verwenden Sie diese Version nur zu Entwicklungs- und Testzwecken.
> 
> Bekannte Einschränkungen:
> - WebRTC-Funktionalität ist noch nicht vollständig implementiert
> - Einige Features sind möglicherweise nicht verfügbar
> - Performance-Optimierungen stehen noch aus
> - Dokumentation ist unvollständig

AuraSpeak ist eine moderne Voice-Chat-Anwendung, die WebRTC für Echtzeit-Kommunikation nutzt. Die Anwendung ermöglicht es Benutzern, Server zu erstellen, Kanäle zu verwalten und in Echtzeit miteinander zu kommunizieren.

## Features

- 🎙️ Echtzeit-Voice-Chat mit WebRTC
- 👥 Server- und Kanal-Management
- 🔐 JWT-basierte Authentifizierung
- 📊 Monitoring und Metriken
- 🐛 Fehler-Tracking mit Sentry
- 📧 E-Mail-Testing mit MailHog
- 🗄️ PostgreSQL-Datenbank
- 📈 Prometheus & Grafana Integration

## Technologie-Stack

### Frontend
- Next.js
- TypeScript
- TailwindCSS
- WebRTC

### Backend
- Go
- Fiber (Web Framework)
- GORM (ORM)
- WebRTC

### Infrastruktur
- Docker & Docker Compose
- PostgreSQL
- Redis
- Prometheus & Grafana
- Sentry
- MailHog

## Voraussetzungen

- Docker
- Docker Compose
- Go 1.21 oder höher
- Node.js 18 oder höher
- pnpm

## Installation

1. Repository klonen:
```bash
git clone https://github.com/yourusername/auraspeak.git
cd auraspeak
```

2. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
# Bearbeiten Sie die .env Datei mit Ihren Einstellungen
```

3. Docker-Container starten:
```bash
docker-compose up -d
```

4. Frontend-Abhängigkeiten installieren:
```bash
cd frontend
pnpm install
```

5. Backend-Abhängigkeiten installieren:
```bash
cd backend
go mod tidy
```

## Entwicklung

### Frontend-Entwicklung
```bash
cd frontend
pnpm dev
```

### Backend-Entwicklung
```bash
cd backend
go run cmd/main.go
```

### Docker-Entwicklung
```bash
docker-compose up -d
```

## Verfügbare Services

| Service    | URL                    | Beschreibung                    |
|------------|------------------------|--------------------------------|
| Frontend   | http://localhost:3000  | Next.js Frontend-Anwendung     |
| Backend    | http://localhost:8080  | Go Backend-API                 |
| PgAdmin    | http://localhost:5050  | PostgreSQL Admin Interface     |
| Grafana    | http://localhost:4000  | Monitoring Dashboard           |
| Prometheus | http://localhost:9090  | Metriken & Monitoring         |
| MailHog    | http://localhost:8025  | E-Mail-Testing Interface       |
| Sentry     | http://localhost:9000  | Fehler-Tracking Dashboard      |

## Monitoring

### Prometheus Metriken
- HTTP-Anfragen
- WebRTC-Verbindungen
- Datenbank-Performance
- Speicherverbrauch

### Grafana Dashboards
- System-Übersicht
- Anwendungs-Metriken
- Datenbank-Performance
- WebRTC-Statistiken

## Fehler-Tracking

Sentry ist für Fehler-Tracking und Performance-Monitoring eingerichtet. Fehler werden automatisch erfasst und können im Sentry-Dashboard eingesehen werden.

## E-Mail-Testing

MailHog ist für das Testen von E-Mail-Funktionalitäten eingerichtet. Alle gesendeten E-Mails werden im MailHog-Interface angezeigt.

## Datenbank

### PostgreSQL
- Port: 5432
- Benutzer: postgres
- Datenbank: auraspeak

### PgAdmin
- URL: http://localhost:5050
- E-Mail: admin@auraspeak.com
- Passwort: admin

## WebRTC

### STUN/TURN Server
- STUN: stun:localhost:3478
- TURN: turn:localhost:3478
- Benutzer: auraspeak
- Passwort: auraspeak

## Deployment

1. Produktions-Umgebungsvariablen konfigurieren
2. Docker-Images bauen:
```bash
docker-compose -f docker-compose.prod.yml build
```
3. Container starten:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Lizenz

MIT

## Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im GitHub-Repository. 