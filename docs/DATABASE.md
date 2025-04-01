# AuraSpeak Datenbank-Dokumentation

## Übersicht

AuraSpeak verwendet PostgreSQL als Hauptdatenbank. Die Datenbank ist in Docker containerisiert und wird über PgAdmin verwaltet.

## Datenbankschema

### Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Servers

```sql
CREATE TABLE servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Channels

```sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Messages

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Members

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, server_id)
);
```

## Indizes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Servers
CREATE INDEX idx_servers_owner_id ON servers(owner_id);

-- Channels
CREATE INDEX idx_channels_server_id ON channels(server_id);

-- Messages
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Members
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_server_id ON members(server_id);
```

## Trigger

### Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Servers
CREATE TRIGGER update_servers_updated_at
    BEFORE UPDATE ON servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Channels
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Members
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Datenbankzugriff

### Verbindungsdetails

- Host: localhost
- Port: 5432
- Datenbank: auraspeak
- Benutzer: postgres
- Passwort: postgres

### PgAdmin

- URL: http://localhost:5050
- E-Mail: admin@admin.com
- Passwort: admin

## Migrationen

Migrationen werden mit GORM (Go) verwaltet. Die Migrationen befinden sich im Backend-Code und werden automatisch ausgeführt.

### Migration ausführen

```bash
cd backend
go run cmd/main.go
```

## Backup & Recovery

### Backup erstellen

```bash
docker exec -t server-postgres-1 pg_dump -U postgres auraspeak > backup.sql
```

### Backup wiederherstellen

```bash
docker exec -i server-postgres-1 psql -U postgres auraspeak < backup.sql
```

## Wartung

### VACUUM

```sql
VACUUM ANALYZE;
```

### Statistiken aktualisieren

```sql
ANALYZE;
```

## Monitoring

### Metriken

- Anzahl der Verbindungen
- Query-Performance
- Speichernutzung
- Cache-Hit-Rate

### Logging

- Query-Logs
- Fehler-Logs
- Performance-Logs

## Sicherheit

### Benutzerrechte

```sql
-- Nur Lesezugriff für Anwendung
CREATE USER auraspeak_app WITH PASSWORD 'auraspeak_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO auraspeak_app;
GRANT USAGE ON SCHEMA public TO auraspeak_app;
```

### Verschlüsselung

- SSL/TLS für Verbindungen
- Passwort-Hashing mit bcrypt
- Sensitive Daten-Verschlüsselung 