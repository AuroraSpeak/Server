package config

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/auraspeak/backend/internal/setup"
	"github.com/auraspeak/backend/internal/types"
	"github.com/spf13/viper"
)

type Config struct {
	Environment string
	Port        string
	JWTSecret   string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
}

func LoadConfig() (*types.Config, error) {
	v := viper.New()

	// Setze den Standardpfad für die Konfigurationsdatei
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "."
	}

	// Konfiguriere Viper für YAML
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(configPath)

	// Prüfe, ob die Konfigurationsdatei existiert
	if err := checkAndPromptConfig(configPath); err != nil {
		return nil, fmt.Errorf("Fehler beim Überprüfen der Konfiguration: %v", err)
	}

	// Lade Konfigurationsdatei
	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("Fehler beim Lesen der Konfigurationsdatei: %v", err)
	}

	// Binde Umgebungsvariablen
	v.AutomaticEnv()

	// Setze Standardwerte
	setDefaults(v)

	// Validiere die Konfiguration
	if err := validateConfig(v); err != nil {
		return nil, fmt.Errorf("Konfigurationsvalidierung fehlgeschlagen: %v", err)
	}

	// Konvertiere zu Config-Struktur
	var config types.Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("Fehler beim Parsen der Konfiguration: %v", err)
	}

	return &config, nil
}

func checkAndPromptConfig(configPath string) error {
	configFile := filepath.Join(configPath, "config.yaml")

	// Prüfe, ob die Konfigurationsdatei existiert
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		fmt.Println("Keine Konfigurationsdatei gefunden.")
		reader := bufio.NewReader(os.Stdin)

		for {
			fmt.Print("Möchten Sie jetzt eine Konfiguration erstellen? (y/n): ")
			input, _ := reader.ReadString('\n')
			input = strings.TrimSpace(strings.ToLower(input))

			if input == "y" || input == "yes" {
				if err := setup.RunSetup(); err != nil {
					return fmt.Errorf("Fehler beim Ausführen des Setups: %v", err)
				}
				return nil
			} else if input == "n" || input == "no" {
				return fmt.Errorf("Keine Konfigurationsdatei vorhanden. Bitte erstellen Sie eine Konfiguration mit dem Setup-Tool")
			}

			fmt.Println("Bitte geben Sie 'y' oder 'n' ein.")
		}
	}

	return nil
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("environment", "development")
	v.SetDefault("port", "8080")
	v.SetDefault("jwt_secret", "development-jwt-secret-key-123")
	v.SetDefault("db.host", "localhost")
	v.SetDefault("db.port", "5432")
	v.SetDefault("db.user", "postgres")
	v.SetDefault("db.password", "postgres")
	v.SetDefault("db.name", "auraspeak")
	v.SetDefault("allowed_origins", "http://localhost:5173")
	v.SetDefault("stun_servers", []string{
		"stun:stun.l.google.com:19302",
		"stun:stun1.l.google.com:19302",
	})
	v.SetDefault("turn_servers", []map[string]string{
		{
			"url":      "turn:openrelay.metered.ca:80",
			"username": "openrelayproject",
			"password": "openrelayproject",
		},
		{
			"url":      "turn:openrelay.metered.ca:443",
			"username": "openrelayproject",
			"password": "openrelayproject",
		},
	})
	v.SetDefault("local_turn.enabled", false)
	v.SetDefault("local_turn.public_ip", "localhost")
	v.SetDefault("local_turn.port", 3478)
	v.SetDefault("local_turn.realm", "auraspeak.local")
	v.SetDefault("local_turn.username", "auraspeak")
	v.SetDefault("local_turn.password", "auraspeak")
	v.SetDefault("local_turn.max_connections", 1000)
	v.SetDefault("local_turn.connection_timeout", 30)
	v.SetDefault("local_turn.rate_limit.requests_per_second", 10)
	v.SetDefault("local_turn.rate_limit.burst_size", 20)
	v.SetDefault("local_turn.allowed_ips", []string{})
	v.SetDefault("local_turn.denied_ips", []string{})
	v.SetDefault("redis.addr", "localhost:6379")
	v.SetDefault("redis.password", "")
	v.SetDefault("redis.db", 0)
}

func validateConfig(v *viper.Viper) error {
	// Validiere erforderliche Felder
	requiredFields := []string{
		"jwt_secret",
		"db.host",
		"db.user",
		"db.password",
		"db.name",
	}

	for _, field := range requiredFields {
		if !v.IsSet(field) {
			return fmt.Errorf("erforderliches Feld fehlt: %s", field)
		}
	}

	// Zusätzliche Validierungen
	if v.GetString("environment") == "production" {
		if v.GetString("jwt_secret") == "development-jwt-secret-key-123" {
			return fmt.Errorf("ungültiges JWT Secret für Produktionsumgebung")
		}
	}

	return nil
}
