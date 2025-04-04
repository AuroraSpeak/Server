# AuraSpeak Entwicklungsdokumentation

## Aktueller Stand (Alpha)

### Implementierte Features

#### Frontend
- ✅ Basis-Projektstruktur mit React + TypeScript
- ✅ Routing mit React Router
- ✅ Theme Provider für Dark/Light Mode
- ✅ Basis-Komponenten (Button, Input, etc.)
- ✅ Authentifizierungsseiten (Login/Register)
- ✅ Responsive Design mit TailwindCSS

#### Backend
- ✅ Basis-Projektstruktur mit Go
- ✅ Fiber Web Framework Integration
- ✅ PostgreSQL Datenbankanbindung mit GORM
- ✅ JWT-basierte Authentifizierung
- ✅ Basis-API-Endpunkte für Auth
- ✅ Docker-Containerisierung

#### Infrastruktur
- ✅ Docker Compose Setup
- ✅ PostgreSQL Datenbank
- ✅ PgAdmin Interface
- ✅ Basis-Monitoring

### In Entwicklung

#### Frontend
- 🚧 WebRTC Integration
- 🚧 Voice-Chat Komponenten
- 🚧 Server-Management Interface
- 🚧 Kanal-Management Interface
- 🚧 Benutzerprofil-Verwaltung

#### Backend
- 🚧 WebRTC Server
- 🚧 STUN/TURN Server
- 🚧 WebSocket Integration
- 🚧 Server-Management API
- 🚧 Kanal-Management API

#### Infrastruktur
- 🚧 Redis Integration
- 🚧 Prometheus & Grafana Setup
- 🚧 Sentry Integration
- 🚧 MailHog Setup

### Bekannte Probleme

1. Frontend
   - WebRTC-Funktionalität noch nicht implementiert
   - API-Aufrufe müssen noch optimiert werden
   - Fehlerbehandlung muss verbessert werden
   - Performance-Optimierungen stehen aus

2. Backend
   - WebRTC-Server noch nicht implementiert
   - WebSocket-Integration fehlt
   - Rate Limiting fehlt
   - Caching-Strategien fehlen

3. Infrastruktur
   - Monitoring noch nicht vollständig eingerichtet
   - Logging-Strategie muss implementiert werden
   - Backup-Strategie fehlt

### Nächste Schritte

1. Kurzfristig
   - WebRTC-Grundfunktionalität implementieren
   - Basis-Voice-Chat entwickeln
   - Server-Management-Features ausbauen
   - Fehlerbehandlung verbessern

2. Mittelfristig
   - Monitoring-System einrichten
   - Performance-Optimierungen durchführen
   - Dokumentation erweitern
   - Tests ausbauen

3. Langfristig
   - Produktions-Readiness herstellen
   - Skalierbarkeit sicherstellen
   - CI/CD-Pipeline aufsetzen
   - Deployment-Strategie entwickeln

## Technische Details

### Frontend-Architektur

```
frontend/
├── src/
│   ├── components/     # Wiederverwendbare UI-Komponenten
│   ├── contexts/      # React Context Provider
│   ├── hooks/         # Custom React Hooks
│   ├── lib/           # Hilfsfunktionen und Utilities
│   ├── pages/         # Seiten-Komponenten
│   ├── services/      # API-Services
│   ├── styles/        # CSS und Styling
│   └── types/         # TypeScript Definitionen
```

### Backend-Architektur

```
backend/
├── cmd/
│   └── main.go        # Anwendungseinstiegspunkt
├── internal/
│   ├── config/        # Konfigurationsmanagement
│   ├── handlers/      # HTTP Request Handler
│   ├── middleware/    # HTTP Middleware
│   ├── models/        # Datenmodelle
│   └── services/      # Geschäftslogik
```

### Datenbank-Schema

Aktuell implementierte Tabellen:
- Users
- Servers
- Channels
- Messages
- Members

## Entwicklungsumgebung

### Lokale Entwicklung

1. Frontend
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

2. Backend
   ```bash
   cd backend
   go mod tidy
   go run cmd/main.go
   ```

3. Docker
   ```bash
   docker compose up -d
   ```

### Verfügbare Services

| Service    | URL                    | Beschreibung                    |
|------------|------------------------|--------------------------------|
| Frontend   | http://localhost:3000  | React Frontend-Anwendung      |
| Backend    | http://localhost:8080  | Go Backend-API                |
| PgAdmin    | http://localhost:5050  | PostgreSQL Admin Interface    |

### API-Endpunkte

#### Authentifizierung
- `POST /api/auth/register` - Benutzerregistrierung
- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/logout` - Benutzerabmeldung
- `GET /api/auth/me` - Aktueller Benutzer

## Best Practices

### Code-Stil

1. Frontend
   - TypeScript für alle neuen Dateien
   - Komponenten in PascalCase
   - Hooks in camelCase
   - Services in camelCase

2. Backend
   - Go Standard Code Style
   - Handler in PascalCase
   - Services in PascalCase
   - Models in Singular

### Git Workflow

1. Branches
   - `main` - Produktionscode
   - `develop` - Entwicklungsbranch
   - `feature/*` - Neue Features
   - `bugfix/*` - Fehlerbehebungen
   - `hotfix/*` - Dringende Produktionsfixes

2. Commits
   - Aussagekräftige Commit-Nachrichten
   - Konventionelle Commits verwenden
   - Feature-Branches von develop abzweigen

### Dokumentation

- Code-Dokumentation in den jeweiligen Dateien
- API-Dokumentation in OpenAPI/Swagger
- Architektur-Dokumentation in docs/
- README.md für Projektübersicht 