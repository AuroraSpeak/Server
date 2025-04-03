#!/bin/bash

# Erstelle einen temporären Ordner für die zu zippenden Dateien
TEMP_DIR="temp_source"
mkdir -p "$TEMP_DIR"

# Kopiere Frontend-Dateien (ohne node_modules, .next und .git)
rsync -av --exclude='node_modules/' --exclude='.next/' --exclude='.git/' frontend/ "$TEMP_DIR/frontend/"

# Kopiere Backend-Dateien (ohne node_modules und .git)
rsync -av --exclude='node_modules/' --exclude='.git/' backend/ "$TEMP_DIR/backend/"

# Kopiere wichtige Konfigurationsdateien
cp docker-compose.yaml "$TEMP_DIR/"
cp Dockerfile "$TEMP_DIR/"
cp .env.example "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"

# Erstelle das ZIP-Archiv
zip -r source_code.zip "$TEMP_DIR"

# Aufräumen
rm -rf "$TEMP_DIR"

echo "Quellcode wurde erfolgreich in source_code.zip gepackt!" 