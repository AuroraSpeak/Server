# AuraSpeak Architektur

## Systemarchitektur

### Übersicht

AuraSpeak ist eine verteilte Anwendung mit einer Microservices-Architektur. Die Hauptkomponenten sind:

1. Frontend (React)
2. Backend (Go)
3. Datenbank (PostgreSQL)
4. Monitoring (Prometheus & Grafana)
5. Logging (Sentry)

### Komponentendiagramm

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   Frontend       |     |    Backend       |     |   PostgreSQL     |
|   (React)        |<--->|    (Go)          |<--->|   (Datenbank)    |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        |                        |                        |
        v                        v                        v
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   Monitoring     |     |    Logging       |     |   PgAdmin        |
|   (Grafana)      |     |    (Sentry)      |     |   (DB Admin)     |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
```

## Frontend-Architektur

### Technologie-Stack

- React 18
- TypeScript
- TailwindCSS
- React Router
- WebRTC

### Komponenten-Hierarchie

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Footer
├── Auth
│   ├── Login
│   └── Register
├── Server
│   ├── ServerList
│   ├── ServerDetail
│   └── ChannelList
└── VoiceChat
    ├── VoiceControls
    └── ParticipantList
```

### State Management

- React Context für globalen Zustand
- Lokaler State mit useState für Komponenten
- Custom Hooks für wiederverwendbare Logik

## Backend-Architektur

### Technologie-Stack

- Go 1.21
- Fiber (Web Framework)
- GORM (ORM)
- WebRTC
- WebSocket

### Schichten

1. **Handler Layer**
   - HTTP Request/Response
   - Request Validierung
   - Response Formatierung

2. **Service Layer**
   - Geschäftslogik
   - Datenverarbeitung
   - Transaktionen

3. **Repository Layer**
   - Datenbankzugriff
   - Datenpersistenz
   - Datenabfragen

### Middleware

- Authentifizierung
- CORS
- Logging
- Rate Limiting
- Error Handling

## Datenbank-Architektur

### Schema

```
Users
  ├── id (PK)
  ├── email
  ├── username
  ├── password_hash
  └── created_at

Servers
  ├── id (PK)
  ├── name
  ├── owner_id (FK)
  └── created_at

Channels
  ├── id (PK)
  ├── name
  ├── server_id (FK)
  └── created_at

Messages
  ├── id (PK)
  ├── content
  ├── user_id (FK)
  ├── channel_id (FK)
  └── created_at

Members
  ├── id (PK)
  ├── user_id (FK)
  ├── server_id (FK)
  └── role
```

## Kommunikation

### API-Kommunikation

- RESTful API
- JWT für Authentifizierung
- JSON für Datenaustausch

### Echtzeit-Kommunikation

- WebSocket für Chat
- WebRTC für Voice-Chat
- STUN/TURN für NAT-Traversal

## Sicherheit

### Authentifizierung

- JWT-basierte Authentifizierung
- Token-Refresh-Mechanismus
- Session-Management

### Autorisierung

- Role-Based Access Control (RBAC)
- Ressourcen-basierte Berechtigungen
- API-Endpunkt-Schutz

### Datenschutz

- HTTPS für alle Kommunikation
- Passwort-Hashing mit bcrypt
- Sensitive Daten-Verschlüsselung

## Skalierbarkeit

### Horizontale Skalierung

- Container-basierte Deployment
- Load Balancing
- Datenbank-Replikation

### Vertikale Skalierung

- Ressourcen-Optimierung
- Caching-Strategien
- Performance-Monitoring

## Monitoring

### Metriken

- System-Performance
- API-Latenz
- Datenbank-Performance
- WebRTC-Statistiken

### Logging

- Strukturiertes Logging
- Fehler-Tracking
- Performance-Tracking

### Alerting

- Fehler-Alerts
- Performance-Alerts
- Ressourcen-Alerts 