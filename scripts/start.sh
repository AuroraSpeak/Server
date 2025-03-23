#!/bin/bash
# Starte die Next.js statische Seite mit "serve"

cd /opt/next-app

# Stelle sicher, dass serve installiert ist
if ! command -v serve &> /dev/null; then
  echo "❌ 'serve' wurde nicht gefunden. Installiere mit: npm install -g serve"
  exit 1
fi

# App starten
exec serve out -l ${PORT:-3000}
