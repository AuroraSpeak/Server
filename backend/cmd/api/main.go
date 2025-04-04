package main

import (
	"log"
	"os"

	"github.com/auraspeak/backend/internal/handlers"
	"github.com/auraspeak/backend/internal/repository"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// Datenbankverbindung herstellen
	db, err := gorm.Open(sqlite.Open("auraspeak.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Repository initialisieren
	channelSettingsRepo := repository.NewChannelSettingsRepository(db)

	// Service initialisieren
	channelSettingsService := services.NewChannelSettingsService(channelSettingsRepo)

	// Handler initialisieren
	channelSettingsHandler := handlers.NewChannelSettingsHandler(channelSettingsService)

	// App initialisieren
	app := fiber.New()

	// CORS Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type,Authorization",
	}))

	// Kanaleinstellungen-Routen
	channelSettings := app.Group("/api/channels/:id/settings")
	{
		channelSettings.Get("", channelSettingsHandler.GetSettings)
		channelSettings.Put("", channelSettingsHandler.UpdateSettings)
		channelSettings.Get("/permissions", channelSettingsHandler.GetPermissionOverwrites)
		channelSettings.Post("/permissions", channelSettingsHandler.CreatePermissionOverwrite)
		channelSettings.Put("/permissions/:overwriteId", channelSettingsHandler.UpdatePermissionOverwrite)
		channelSettings.Delete("/permissions/:overwriteId", channelSettingsHandler.DeletePermissionOverwrite)
	}

	// Server starten
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}
