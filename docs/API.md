# AuraSpeak API-Dokumentation

## Übersicht

Die AuraSpeak API ist eine RESTful API, die über HTTP/HTTPS kommuniziert. Alle Anfragen und Antworten verwenden das JSON-Format.

## Basis-URL

```
http://localhost:8080/api
```

## Authentifizierung

Die API verwendet JWT (JSON Web Tokens) für die Authentifizierung. Der Token muss im Authorization-Header als Bearer Token gesendet werden:

```
Authorization: Bearer <token>
```

## Endpunkte

### Authentifizierung

#### Registrierung

```http
POST /auth/register
```

Request Body:
```json
{
  "email": "string",
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  }
}
```

#### Anmeldung

```http
POST /auth/login
```

Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  }
}
```

#### Abmeldung

```http
POST /auth/logout
```

Response:
```json
{
  "message": "Successfully logged out"
}
```

#### Aktueller Benutzer

```http
GET /auth/me
```

Response:
```json
{
  "id": "string",
  "email": "string",
  "username": "string"
}
```

### Server

#### Server erstellen

```http
POST /servers
```

Request Body:
```json
{
  "name": "string"
}
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "owner_id": "string",
  "created_at": "string"
}
```

#### Server abrufen

```http
GET /servers
```

Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "owner_id": "string",
    "created_at": "string"
  }
]
```

#### Einzelnen Server abrufen

```http
GET /servers/:id
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "owner_id": "string",
  "created_at": "string"
}
```

### Kanäle

#### Kanal erstellen

```http
POST /servers/:serverId/channels
```

Request Body:
```json
{
  "name": "string"
}
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "server_id": "string",
  "created_at": "string"
}
```

#### Server-Kanäle abrufen

```http
GET /servers/:serverId/channels
```

Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "server_id": "string",
    "created_at": "string"
  }
]
```

### Nachrichten

#### Nachricht erstellen

```http
POST /channels/:channelId/messages
```

Request Body:
```json
{
  "content": "string"
}
```

Response:
```json
{
  "id": "string",
  "content": "string",
  "user_id": "string",
  "channel_id": "string",
  "created_at": "string"
}
```

#### Kanal-Nachrichten abrufen

```http
GET /channels/:channelId/messages
```

Response:
```json
[
  {
    "id": "string",
    "content": "string",
    "user_id": "string",
    "channel_id": "string",
    "created_at": "string"
  }
]
```

## WebSocket API

### Verbindung

```http
GET /ws/:serverId
```

### Nachrichtentypen

1. Chat-Nachrichten
2. Voice-Chat-Events
3. Benutzer-Status-Updates

## WebRTC API

### Angebot erstellen

```http
POST /webrtc/offer
```

Request Body:
```json
{
  "sdp": "string",
  "channel_id": "string"
}
```

### Antwort erstellen

```http
POST /webrtc/answer
```

Request Body:
```json
{
  "sdp": "string",
  "channel_id": "string"
}
```

### ICE-Kandidat hinzufügen

```http
POST /webrtc/ice-candidate
```

Request Body:
```json
{
  "candidate": "string",
  "channel_id": "string"
}
```

## Fehlerbehandlung

### Fehlercodes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### Fehlerformat

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Rate Limiting

- 100 Anfragen pro Minute pro IP
- 1000 Anfragen pro Stunde pro Benutzer

## Versionierung

Die API ist versioniert über den URL-Pfad:

```
/api/v1/...
```

## CORS

Erlaubte Origins:
- http://localhost:3000
- https://auraspeak.com (Produktion) 