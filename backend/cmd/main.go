package main

import (
	"fmt"
	"log"

	"github.com/auraspeak/backend/internal/config"
	"github.com/auraspeak/backend/internal/handlers"
	"github.com/auraspeak/backend/internal/middleware"
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	// Initialize database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// Auto migrate models
	err = db.AutoMigrate(&models.User{}, &models.Server{}, &models.Channel{}, &models.Message{}, &models.Member{})
	if err != nil {
		log.Fatal(err)
	}

	// Initialize services
	authService := services.NewAuthService(db, cfg.JWTSecret)
	serverService := services.NewServerService(db)
	channelService := services.NewChannelService(db)
	messageService := services.NewMessageService(db)
	webrtcService := services.NewWebRTCService()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	serverHandler := handlers.NewServerHandler(serverService)
	channelHandler := handlers.NewChannelHandler(channelService, serverService)
	messageHandler := handlers.NewMessageHandler(messageService, serverService)
	webrtcHandler := handlers.NewWebRTCHandler(webrtcService, serverService)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "AuraSpeak API",
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Prometheus metrics endpoint
	app.Get("/metrics", func(c *fiber.Ctx) error {
		promhttp.Handler().ServeHTTP(c.Response().ResponseWriter, c.Request())
		return nil
	})

	// Public routes
	app.Post("/api/auth/register", authHandler.Register)
	app.Post("/api/auth/login", authHandler.Login)

	// Protected routes
	api := app.Group("/api")
	api.Use(middleware.AuthMiddleware(authService))

	// Auth routes
	api.Get("/auth/me", authHandler.Me)

	// Server routes
	api.Post("/servers", serverHandler.CreateServer)
	api.Get("/servers", serverHandler.GetUserServers)
	api.Get("/servers/:id", serverHandler.GetServer)
	api.Put("/servers/:id", serverHandler.UpdateServer)
	api.Delete("/servers/:id", serverHandler.DeleteServer)

	// Channel routes
	api.Post("/servers/:serverId/channels", channelHandler.CreateChannel)
	api.Get("/servers/:serverId/channels", channelHandler.GetServerChannels)
	api.Get("/channels/:id", channelHandler.GetChannel)
	api.Put("/channels/:id", channelHandler.UpdateChannel)
	api.Delete("/channels/:id", channelHandler.DeleteChannel)

	// Message routes
	api.Post("/channels/:channelId/messages", messageHandler.CreateMessage)
	api.Get("/channels/:channelId/messages", messageHandler.GetChannelMessages)
	api.Put("/messages/:id", messageHandler.UpdateMessage)
	api.Delete("/messages/:id", messageHandler.DeleteMessage)

	// WebRTC routes
	api.Post("/webrtc/offer", webrtcHandler.CreateOffer)
	api.Post("/webrtc/answer", webrtcHandler.CreateAnswer)
	api.Post("/webrtc/ice-candidate", webrtcHandler.AddICECandidate)

	// Start server
	log.Fatal(app.Listen(":" + cfg.Port))
}
