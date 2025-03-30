-- Erstelle Glitchtip-Datenbank und Benutzer
CREATE DATABASE glitchtip_db;
CREATE USER glitchtip_user WITH PASSWORD 'glitchtip_password';
GRANT ALL PRIVILEGES ON DATABASE glitchtip_db TO glitchtip_user;

-- Erstelle Next-App-Datenbank und Benutzer (falls noch nicht vorhanden)
CREATE DATABASE voicedb;
CREATE USER voiceuser WITH PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE voicedb TO voiceuser;

-- Verbinde mit der Glitchtip-Datenbank
\c glitchtip_db

-- Erstelle Schema für Glitchtip
CREATE SCHEMA IF NOT EXISTS glitchtip;
GRANT ALL ON SCHEMA glitchtip TO glitchtip_user;

-- Verbinde mit der Next-App-Datenbank
\c voicedb

-- Erstelle Schema für die Next-App
CREATE SCHEMA IF NOT EXISTS voice;
GRANT ALL ON SCHEMA voice TO voiceuser; 