package main

import (
	"log"

	"github.com/auraspeak/backend/internal/config"
	"github.com/auraspeak/backend/internal/handlers"
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/routes"
	"github.com/auraspeak/backend/internal/services"
	"github.com/auraspeak/backend/internal/websocket"

	"github.com/joho/godotenv"
)

func main() {
	// Lade Umgebungsvariablen
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := services.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Auto migrate models
	err = db.AutoMigrate(&models.User{}, &models.Server{}, &models.Channel{}, &models.Message{}, &models.Member{})
	if err != nil {
		log.Fatal(err)
	}

	// Initialize Redis cache
	cache, err := services.NewCacheService(
		cfg.Redis.Addr,
		cfg.Redis.Password,
		cfg.Redis.DB,
	)
	if err != nil {
		log.Printf("Warning: Failed to initialize Redis cache: %v", err)
		cache = nil // Cache wird deaktiviert
	}

	// Initialize services
	authService := services.NewAuthService(db, cfg.JWTSecret)
	serverService := services.NewServerService(db, cache)
	channelService := services.NewChannelService(db)
	messageService := services.NewMessageService(db)
	webrtcService, err := services.NewWebRTCService(db, cfg)
	if err != nil {
		log.Fatalf("Failed to initialize WebRTC service: %v", err)
	}

	// Initialize WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// Initialize local TURN server if enabled
	var turnService *services.TURNService
	if cfg.LocalTURN.Enabled {
		turnService, err = services.NewTURNService(cfg)
		if err != nil {
			log.Fatalf("Failed to initialize TURN service: %v", err)
		}

		// Start TURN server in a goroutine
		go func() {
			if err := turnService.Start(); err != nil {
				log.Printf("Failed to start TURN server: %v", err)
			}
		}()
	}

	// Initialize handlers
	h := handlers.NewHandlers(
		db,
		authService,
		serverService,
		channelService,
		messageService,
		webrtcService,
	)

	// Initialize server
	server := config.NewServer(db, cfg)

	// Setup middleware
	server.SetupMiddleware()

	// Setup routes
	routes.SetupRoutes(server.App(), h, wsHub, authService)

	// Start server
	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
