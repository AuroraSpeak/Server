# API-Routen Dokumentation

## Öffentliche Routen

### Authentifizierung
- `POST /api/auth/register` - Registrierung eines neuen Benutzers
- `POST /api/auth/login` - Anmeldung eines Benutzers

## Geschützte Routen (erfordert JWT-Token)

### Authentifizierung
- `GET /api/auth/me` - Abrufen des aktuellen Benutzerprofils

### Server
- `GET /api/servers` - Liste aller Server des Benutzers
- `POST /api/servers` - Erstellen eines neuen Servers
- `GET /api/servers/:id` - Details eines spezifischen Servers
- `GET /api/servers/:id/stats` - Statistiken eines Servers
- `PUT /api/servers/:id` - Aktualisieren eines Servers
- `DELETE /api/servers/:id` - Löschen eines Servers

### Kanäle
- `POST /api/servers/:serverId/channels` - Erstellen eines neuen Kanals
- `GET /api/servers/:serverId/channels` - Liste aller Kanäle eines Servers
- `GET /api/channels/:id` - Details eines spezifischen Kanals
- `PUT /api/channels/:id` - Aktualisieren eines Kanals
- `DELETE /api/channels/:id` - Löschen eines Kanals

### Nachrichten
- `POST /api/channels/:channelId/messages` - Senden einer neuen Nachricht
- `GET /api/channels/:channelId/messages` - Abrufen der Nachrichten eines Kanals
- `PUT /api/messages/:id` - Bearbeiten einer Nachricht
- `DELETE /api/messages/:id` - Löschen einer Nachricht

### WebRTC
- `POST /api/webrtc/offer` - Erstellen eines WebRTC-Angebots
- `POST /api/webrtc/answer` - Erstellen einer WebRTC-Antwort
- `POST /api/webrtc/ice-candidate` - Hinzufügen eines ICE-Kandidaten
- `GET /api/ws` - WebSocket-Verbindung für Echtzeit-Kommunikation

## Authentifizierung

Alle geschützten Routen erfordern einen gültigen JWT-Token im Authorization-Header:
```
Authorization: Bearer <token>
```

## Fehlerantworten

Die API verwendet standardisierte HTTP-Statuscodes:
- `200` - Erfolgreiche Anfrage
- `201` - Erfolgreiche Erstellung
- `400` - Ungültige Anfrage
- `401` - Nicht authentifiziert
- `403` - Nicht autorisiert
- `404` - Ressource nicht gefunden
- `500` - Serverfehler

## WebSocket-Verbindung

Die WebSocket-Verbindung wird für Echtzeit-Kommunikation verwendet und unterstützt folgende Nachrichtentypen:
- `offer` - WebRTC-Angebot
- `answer` - WebRTC-Antwort
- `candidate` - ICE-Kandidat
- `disconnect` - Trennen der Verbindung

## STUN/TURN Server

Die Anwendung verwendet folgende STUN/TURN-Server für die WebRTC-Verbindung:

### STUN Server
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

### TURN Server
- `turn:openrelay.metered.ca:80`
- `turn:openrelay.metered.ca:443`

Die TURN-Server erfordern Authentifizierung mit den folgenden Anmeldedaten:
- Username: `openrelayproject`
- Password: `openrelayproject`

### Lokaler TURN-Server

Die Anwendung unterstützt auch einen lokalen TURN-Server, der über Umgebungsvariablen konfiguriert werden kann:

```env
LOCAL_TURN_ENABLED=true
LOCAL_TURN_PUBLIC_IP=your-public-ip
LOCAL_TURN_PORT=3478
LOCAL_TURN_REALM=auraspeak.local
LOCAL_TURN_USERNAME=auraspeak
LOCAL_TURN_PASSWORD=auraspeak

# Sicherheitseinstellungen
LOCAL_TURN_MAX_CONNECTIONS=1000
LOCAL_TURN_CONNECTION_TIMEOUT=30
LOCAL_TURN_RATE_LIMIT_REQUESTS=10
LOCAL_TURN_RATE_LIMIT_BURST=20
LOCAL_TURN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
LOCAL_TURN_DENIED_IPS=192.168.1.100,10.0.0.50
```

Der lokale TURN-Server läuft auf Port 3478 (Standard-TURN-Port) und kann für lokale Entwicklung oder private Netzwerke verwendet werden.

#### Sicherheitsfunktionen
- HMAC-SHA1-basierte Authentifizierung mit temporären Passwörtern
- Rate Limiting (10 Anfragen pro Sekunde, Burst von 20)
- Verbindungslimits (max. 1000 gleichzeitige Verbindungen)
- Timeout nach 30 Sekunden Inaktivität
- IP-basierte Zugriffskontrolle (Whitelist/Blacklist)
- Keine Loopback-Verbindungen erlaubt
- Erzwungene Authentifizierung

Diese Server ermöglichen die Peer-to-Peer-Verbindung auch hinter NATs und Firewalls. 