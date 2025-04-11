# AuraSpeak Backend

AuraSpeak ist eine moderne Kommunikationsplattform mit Echtzeit-Chat und Sprachfunktionen.

## 📋 Inhaltsverzeichnis

- [Features](#-features)
- [Technologie-Stack](#-technologie-stack)
- [Installation](#-installation)
- [Konfiguration](#-konfiguration)
- [Entwicklung](#-entwicklung)
- [Wartung](#-wartung)
- [Fehlerbehebung](#-fehlerbehebung)
- [Sicherheit](#-sicherheit)
- [Support](#-support)
- [Lizenz](#-lizenz)

## 🚀 Features

- **Echtzeit-Kommunikation**
  - Text-Chat über WebSocket
  - Voice-Chat über WebRTC
  - Integrierter STUN/TURN Server
- **Authentifizierung & Autorisierung**
  - JWT-basierte Authentifizierung
  - Rollenbasierte Zugriffskontrolle
- **Datenbank & Caching**
  - PostgreSQL für persistente Datenspeicherung
  - Redis für Caching und Session-Management
- **Monitoring & Fehler-Tracking**
  - Sentry Integration für Error-Tracking
  - Strukturiertes Logging mit Zap
- **Skalierbarkeit & Performance**
  - Docker-Container für einfache Skalierung
  - Optimierte Datenbankabfragen
  - In-Memory Caching

## 🛠 Technologie-Stack

- **Go** - Hauptprogrammiersprache
- **Fiber** - Web Framework
- **PostgreSQL** - Hauptdatenbank
- **Redis** - Caching & Session-Management
- **WebRTC** - Voice-Chat
- **Docker** - Containerisierung
- **Sentry** - Error-Tracking

## 🏗 Installation

### Voraussetzungen

- Ubuntu 20.04 LTS oder höher
- Docker und Docker Compose
- Systemd
- Mindestens 2GB RAM
- Mindestens 10GB freier Speicherplatz

### 1. Systemvorbereitung

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Benötigte Pakete installieren
sudo apt install -y docker.io docker-compose

# Docker ohne sudo nutzen
sudo usermod -aG docker $USER

# AuraSpeak Benutzer erstellen
sudo useradd -r -s /bin/false auraspeak

# Verzeichnisse erstellen
sudo mkdir -p /opt/auraspeak /etc/auraspeak
sudo chown -R auraspeak:auraspeak /opt/auraspeak /etc/auraspeak
```

### 2. Installation

#### Option 1: DEB-Paket (empfohlen)
```bash
# Paket herunterladen und installieren
sudo dpkg -i auraspeak-backend_*.deb
```

#### Option 2: Manuelle Installation
```bash
# Repository klonen
git clone https://github.com/auraspeak/backend.git
cd backend

# Projekt bauen
GOOS=linux GOARCH=amd64 go build -o auraspeak-backend cmd/main.go

# Dateien kopieren
sudo cp auraspeak-backend /usr/local/bin/
sudo cp config.yaml /etc/auraspeak/
sudo cp .env.example /etc/auraspeak/.env
sudo cp auraspeak-backend.service /etc/systemd/system/
```

### 3. Docker-Setup

```bash
# Netzwerk erstellen
docker network create auraspeak-network

# Container starten
cd /opt/auraspeak
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Service starten

```bash
# Systemd neu laden und Service starten
sudo systemctl daemon-reload
sudo systemctl enable auraspeak-backend
sudo systemctl start auraspeak-backend

# Status überprüfen
sudo systemctl status auraspeak-backend
```

## ⚙️ Konfiguration

### Umgebungsvariablen
```bash
sudo nano /etc/auraspeak/.env
```

### Hauptkonfiguration
```bash
sudo nano /etc/auraspeak/config.yaml
```

### Wichtige Konfigurationsoptionen
- `DATABASE_URL`: PostgreSQL-Verbindungsstring
- `REDIS_URL`: Redis-Verbindungsstring
- `JWT_SECRET`: Geheimer Schlüssel für JWT
- `SENTRY_DSN`: Sentry Data Source Name
- `ENVIRONMENT`: Umgebung (development/production)

## 💻 Entwicklung

### Voraussetzungen
- Go 1.22+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Entwicklungsumgebung einrichten
```bash
# Repository klonen
git clone https://github.com/auraspeak/server.git
cd server

# Abhängigkeiten installieren
go mod download
go mod vendor

# Umgebungsvariablen konfigurieren
cp .env.example .env

# Entwicklungsserver starten
cd ../Env
./dev.sh
```

## 🔧 Wartung

### Logs anzeigen
```bash
sudo journalctl -u auraspeak-backend -f
```

### Service verwalten
```bash
# Service neu starten
sudo systemctl restart auraspeak-backend

# Service stoppen
sudo systemctl stop auraspeak-backend
```

### Updates installieren
```bash
# DEB-Paket aktualisieren
sudo dpkg -i auraspeak-backend_*.deb
sudo systemctl restart auraspeak-backend

# Docker-Container aktualisieren
cd /opt/auraspeak
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 Fehlerbehebung

### Häufige Probleme

1. **Service startet nicht**
   - Überprüfen Sie die Logs: `sudo journalctl -u auraspeak-backend`
   - Stellen Sie sicher, dass die Berechtigungen korrekt sind
   - Überprüfen Sie die Konfigurationsdateien

2. **Docker-Container starten nicht**
   - Überprüfen Sie die Docker-Logs: `docker-compose logs`
   - Stellen Sie sicher, dass das Netzwerk existiert
   - Überprüfen Sie die Port-Konfiguration

3. **API nicht erreichbar**
   - Überprüfen Sie die Firewall-Einstellungen
   - Stellen Sie sicher, dass der Service läuft
   - Überprüfen Sie die Netzwerk-Konfiguration

## 🔒 Sicherheit

### Firewall-Konfiguration
```bash
# Nötige Ports freigeben
sudo ufw allow 8080/tcp  # API
sudo ufw allow 8443/tcp  # HTTPS
sudo ufw allow 3478/udp  # STUN/TURN
```

### SSL/TLS
- Stellen Sie sicher, dass gültige SSL-Zertifikate installiert sind
- Aktualisieren Sie die Zertifikate regelmäßig
- Verwenden Sie starke Verschlüsselungsmethoden

## 🤝 Support

Bei Problemen oder Fragen:
1. Überprüfen Sie die [Dokumentation](https://github.com/auraspeak/docs)
2. Erstellen Sie ein [Issue](https://github.com/auraspeak/backend/issues)
3. Kontaktieren Sie das Support-Team

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details. 