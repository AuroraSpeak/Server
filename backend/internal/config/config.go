package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	JWTSecret      string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	AllowedOrigins string
}

func LoadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("error loading .env file: %v", err)
	}

	config := &Config{
		Port:           getEnvOrDefault("PORT", "8080"),
		JWTSecret:      getEnvOrDefault("JWT_SECRET", "development-jwt-secret-key-123"),
		DBHost:         getEnvOrDefault("DB_HOST", "localhost"),
		DBPort:         getEnvOrDefault("DB_PORT", "5432"),
		DBUser:         getEnvOrDefault("DB_USER", "postgres"),
		DBPassword:     getEnvOrDefault("DB_PASSWORD", "postgres"),
		DBName:         getEnvOrDefault("DB_NAME", "auraspeak"),
		AllowedOrigins: getEnvOrDefault("ALLOWED_ORIGINS", "http://localhost:5173"),
	}

	return config, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
