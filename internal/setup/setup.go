package setup

import (
	"bufio"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/auraspeak/backend/internal/types"
	"gopkg.in/yaml.v3"
)

func RunSetup() error {
	reader := bufio.NewReader(os.Stdin)
	config := types.Config{}

	fmt.Println("=== AuraSpeak Server Setup ===")
	fmt.Println("Bitte beantworten Sie die folgenden Fragen zur Konfiguration.")

	// Allgemeine Einstellungen
	config.Environment = readString(reader, "Umgebung (development/production)", "development")
	config.Port = readString(reader, "Port", "8080")
	config.JWTSecret = generateSecureKey(32)
	fmt.Printf("Generiertes JWT Secret: %s\n", config.JWTSecret)
	config.AllowedOrigins = readString(reader, "Erlaubte Origins (kommagetrennt)", "http://localhost:5173")

	// Datenbank Konfiguration
	fmt.Println("\n=== Datenbank Konfiguration ===")
	config.DBHost = readString(reader, "Datenbank Host", "localhost")
	config.DBPort = readString(reader, "Datenbank Port", "5432")
	config.DBUser = readString(reader, "Datenbank Benutzer", "postgres")
	config.DBPassword = readString(reader, "Datenbank Passwort", "postgres")
	config.DBName = readString(reader, "Datenbank Name", "auraspeak")

	// STUN Server
	fmt.Println("\n=== STUN Server Konfiguration ===")
	stunServers := readString(reader, "STUN Server URLs (kommagetrennt)", "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302")
	config.STUNServers = strings.Split(stunServers, ",")

	// TURN Server
	fmt.Println("\n=== TURN Server Konfiguration ===")
	turnCount := readInt(reader, "Anzahl der TURN Server", 2)
	config.TURNServers = make([]struct {
		URL      string
		Username string
		Password string
	}, turnCount)

	for i := 0; i < turnCount; i++ {
		fmt.Printf("\nTURN Server %d:\n", i+1)
		config.TURNServers[i].URL = readString(reader, "TURN Server URL", "turn:openrelay.metered.ca:80")
		config.TURNServers[i].Username = readString(reader, "TURN Benutzername", "openrelayproject")
		config.TURNServers[i].Password = readString(reader, "TURN Passwort", "openrelayproject")
	}

	// Lokaler TURN Server
	fmt.Println("\n=== Lokaler TURN Server Konfiguration ===")
	config.LocalTURN.Enabled = readBool(reader, "Lokalen TURN Server aktivieren?", false)
	if config.LocalTURN.Enabled {
		config.LocalTURN.PublicIP = readString(reader, "Öffentliche IP", "localhost")
		config.LocalTURN.Port = readInt(reader, "Port", 3478)
		config.LocalTURN.Realm = readString(reader, "Realm", "auraspeak.local")
		config.LocalTURN.Username = readString(reader, "Benutzername", "auraspeak")
		config.LocalTURN.Password = generateSecureKey(16)
		fmt.Printf("Generiertes TURN Passwort: %s\n", config.LocalTURN.Password)
		config.LocalTURN.MaxConnections = readInt(reader, "Maximale Verbindungen", 1000)
		config.LocalTURN.ConnectionTimeout = readInt(reader, "Verbindungs-Timeout (Sekunden)", 30)
		config.LocalTURN.RateLimit.RequestsPerSecond = readInt(reader, "Anfragen pro Sekunde", 10)
		config.LocalTURN.RateLimit.BurstSize = readInt(reader, "Burst Größe", 20)
	}

	// Redis Konfiguration
	fmt.Println("\n=== Redis Konfiguration ===")
	config.Redis.Addr = readString(reader, "Redis Adresse", "localhost:6379")
	config.Redis.Password = generateSecureKey(16)
	fmt.Printf("Generiertes Redis Passwort: %s\n", config.Redis.Password)
	config.Redis.DB = readInt(reader, "Redis DB", 0)

	// Konfiguration speichern
	configPath := "config.yaml"
	if err := saveConfig(config, configPath); err != nil {
		return fmt.Errorf("Fehler beim Speichern der Konfiguration: %v", err)
	}

	fmt.Printf("\nKonfiguration wurde erfolgreich in %s gespeichert.\n", configPath)
	fmt.Println("Bitte bewahren Sie die generierten Schlüssel sicher auf!")
	return nil
}

func readString(reader *bufio.Reader, prompt, defaultValue string) string {
	fmt.Printf("%s [%s]: ", prompt, defaultValue)
	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(input)
	if input == "" {
		return defaultValue
	}
	return input
}

func readInt(reader *bufio.Reader, prompt string, defaultValue int) int {
	for {
		fmt.Printf("%s [%d]: ", prompt, defaultValue)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		if input == "" {
			return defaultValue
		}
		value, err := strconv.Atoi(input)
		if err == nil {
			return value
		}
		fmt.Println("Bitte geben Sie eine gültige Zahl ein.")
	}
}

func readBool(reader *bufio.Reader, prompt string, defaultValue bool) bool {
	defaultStr := "n"
	if defaultValue {
		defaultStr = "y"
	}
	for {
		fmt.Printf("%s (y/n) [%s]: ", prompt, defaultStr)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(strings.ToLower(input))
		if input == "" {
			return defaultValue
		}
		if input == "y" || input == "yes" {
			return true
		}
		if input == "n" || input == "no" {
			return false
		}
		fmt.Println("Bitte geben Sie 'y' oder 'n' ein.")
	}
}

func generateSecureKey(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return base64.URLEncoding.EncodeToString(bytes)
}

func saveConfig(config types.Config, path string) error {
	data, err := yaml.Marshal(&config)
	if err != nil {
		return err
	}

	// Erstelle das Verzeichnis, falls es nicht existiert
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
