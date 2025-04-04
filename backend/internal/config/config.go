package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment    string
	Port           string
	JWTSecret      string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	AllowedOrigins string
	STUNServers    []string
	TURNServers    []struct {
		URL      string
		Username string
		Password string
	}
	LocalTURN struct {
		Enabled           bool
		PublicIP          string
		Port              int
		Realm             string
		Username          string
		Password          string
		MaxConnections    int
		ConnectionTimeout int
		RateLimit         struct {
			RequestsPerSecond int
			BurstSize         int
		}
		AllowedIPs []string
		DeniedIPs  []string
	}
	Redis struct {
		Addr     string
		Password string
		DB       int
	}
}

func LoadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("error loading .env file: %v", err)
	}

	config := &Config{
		Environment:    getEnvOrDefault("ENVIRONMENT", "development"),
		Port:           getEnvOrDefault("PORT", "8080"),
		JWTSecret:      getEnvOrDefault("JWT_SECRET", "development-jwt-secret-key-123"),
		DBHost:         getEnvOrDefault("DB_HOST", "localhost"),
		DBPort:         getEnvOrDefault("DB_PORT", "5432"),
		DBUser:         getEnvOrDefault("DB_USER", "postgres"),
		DBPassword:     getEnvOrDefault("DB_PASSWORD", "postgres"),
		DBName:         getEnvOrDefault("DB_NAME", "auraspeak"),
		AllowedOrigins: getEnvOrDefault("ALLOWED_ORIGINS", "http://localhost:5173"),
		STUNServers: []string{
			getEnvOrDefault("STUN_SERVER_1", "stun:stun.l.google.com:19302"),
			getEnvOrDefault("STUN_SERVER_2", "stun:stun1.l.google.com:19302"),
		},
		TURNServers: []struct {
			URL      string
			Username string
			Password string
		}{
			{
				URL:      getEnvOrDefault("TURN_SERVER_1", "turn:openrelay.metered.ca:80"),
				Username: getEnvOrDefault("TURN_USERNAME_1", "openrelayproject"),
				Password: getEnvOrDefault("TURN_PASSWORD_1", "openrelayproject"),
			},
			{
				URL:      getEnvOrDefault("TURN_SERVER_2", "turn:openrelay.metered.ca:443"),
				Username: getEnvOrDefault("TURN_USERNAME_2", "openrelayproject"),
				Password: getEnvOrDefault("TURN_PASSWORD_2", "openrelayproject"),
			},
		},
		LocalTURN: struct {
			Enabled           bool
			PublicIP          string
			Port              int
			Realm             string
			Username          string
			Password          string
			MaxConnections    int
			ConnectionTimeout int
			RateLimit         struct {
				RequestsPerSecond int
				BurstSize         int
			}
			AllowedIPs []string
			DeniedIPs  []string
		}{
			Enabled:           getEnvOrDefault("LOCAL_TURN_ENABLED", "false") == "true",
			PublicIP:          getEnvOrDefault("LOCAL_TURN_PUBLIC_IP", "localhost"),
			Port:              3478, // Standard TURN-Port
			Realm:             getEnvOrDefault("LOCAL_TURN_REALM", "auraspeak.local"),
			Username:          getEnvOrDefault("LOCAL_TURN_USERNAME", "auraspeak"),
			Password:          getEnvOrDefault("LOCAL_TURN_PASSWORD", "auraspeak"),
			MaxConnections:    1000,
			ConnectionTimeout: 30,
			RateLimit: struct {
				RequestsPerSecond int
				BurstSize         int
			}{
				RequestsPerSecond: 10,
				BurstSize:         20,
			},
			AllowedIPs: []string{}, // Leer bedeutet alle IPs erlaubt
			DeniedIPs:  []string{}, // Leer bedeutet keine IPs blockiert
		},
		Redis: struct {
			Addr     string
			Password string
			DB       int
		}{
			Addr:     getEnvOrDefault("REDIS_ADDR", "localhost:6379"),
			Password: getEnvOrDefault("REDIS_PASSWORD", ""),
			DB:       0,
		},
	}

	return config, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
