package main

import (
	"fmt"
	"log"
	"os"

	"github.com/auraspeak/backend/internal/config"
	"github.com/auraspeak/backend/internal/handlers"
	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/repository"
	"github.com/auraspeak/backend/internal/routes"
	"github.com/auraspeak/backend/internal/services"
	"github.com/auraspeak/backend/internal/websocket"
	"github.com/joho/godotenv"
	"github.com/pion/webrtc/v3"
)

func main() {
	// Lade Umgebungsvariablen
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Initialize logger
	if err := logging.Init(os.Getenv("ENV")); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logging.Sync()

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
	err = db.AutoMigrate(
		&models.User{},
		&models.Server{},
		&models.Channel{},
		&models.Message{},
		&models.Member{},
		&models.Invite{},
		&models.Role{},
		&models.ServerSettings{},
		&models.MediaFile{},
		&models.Friend{},
		&models.ChannelSettings{},
	)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize Sentry
	sentryService, err := services.NewSentryService(
		cfg.Sentry.DSN,
		cfg.Sentry.Environment,
		logger,
	)
	if err != nil {
		log.Printf("Warning: Failed to initialize Sentry: %v", err)
	}

	// Initialize Redis cache
	cache, err := services.NewCacheService(cfg)
	if err != nil {
		log.Printf("Warning: Failed to initialize Redis cache: %v", err)
		cache = nil // Cache wird deaktiviert
	}

	// Initialize services
	authService := services.NewAuthService(db, cfg.JWTSecret)
	serverService := services.NewServerService(db, cache)
	channelService := services.NewChannelService(db)
	messageService := services.NewMessageService(db)

	logger := logging.NewLogger("webrtc")

	// Host-IP aus Umgebungsvariable oder localhost
	hostIP := os.Getenv("HOST_IP")
	if hostIP == "" {
		hostIP = "localhost"
	}

	webrtcConfig := &webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{fmt.Sprintf("stun:%s:3478", hostIP)},
			},
		},
	}
	webrtcService := services.NewWebRTCService(webrtcConfig, logger)

	inviteService := services.NewInviteService(db)
	channelSettingsRepo := repository.NewChannelSettingsRepository(db)
	channelSettingsService := services.NewChannelSettingsService(channelSettingsRepo)

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
		inviteService,
		channelSettingsService,
	)

	// Initialize server
	server, err := config.NewServer(db, cfg)
	if err != nil {
		log.Fatalf("Failed to initialize server: %v", err)
	}

	// Setup middleware
	server.SetupMiddleware()

	// Setup routes
	routes.SetupRoutes(server.App(), h, wsHub, authService)

	// Initialize Sentry
	if sentryService != nil {
		// Füge Sentry Middleware hinzu
		server.App().Use(sentryService.Middleware())
	}

	// Start server
	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
