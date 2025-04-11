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
	"go.uber.org/zap"
)

func main() {
	// Lade Umgebungsvariablen
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Initialize logging
	logging.Init("AuraSpeak", logging.InfoLevel)

	// Create main logger after initialization
	mainLogger := logging.NewLogger("main")

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		mainLogger.Fatal("Failed to load config", zap.Error(err))
	}

	// Initialize Sentry
	var sentryService *services.SentryService
	var sentryErr error
	sentryService, sentryErr = services.NewSentryService(
		cfg.Sentry.DSN,
		cfg.Sentry.Environment,
		mainLogger,
	)
	if sentryErr != nil {
		mainLogger.Warn("Failed to initialize Sentry", zap.Error(sentryErr))
	}

	// Initialize database
	db, err := services.InitDB()
	if err != nil {
		mainLogger.Fatal("Failed to initialize database", zap.Error(err))
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
		mainLogger.Fatal("Failed to migrate models", zap.Error(err))
	}

	// Initialize Redis cache
	cache, err := services.NewCacheService(cfg)
	if err != nil {
		mainLogger.Warn("Failed to initialize Redis cache", zap.Error(err))
		cache = nil // Cache wird deaktiviert
	}

	// Initialize services
	authService := services.NewAuthService(db, cfg.JWTSecret)
	serverService := services.NewServerService(db, cache)
	channelService := services.NewChannelService(db)
	messageService := services.NewMessageService(db)

	webrtcLogger := logging.NewLogger("webrtc")

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
	webrtcService := services.NewWebRTCService(webrtcConfig, webrtcLogger)

	inviteService := services.NewInviteService(db)
	channelSettingsRepo := repository.NewChannelSettingsRepository(db)
	channelSettingsService := services.NewChannelSettingsService(channelSettingsRepo)

	// Initialize WebSocket Hub
	hub := websocket.NewHub(websocket.NewLogger("Hub"))
	go hub.Run()

	// Initialize local TURN server if enabled
	var turnService *services.TURNService
	if cfg.LocalTURN.Enabled {
		turnService, err = services.NewTURNService(cfg)
		if err != nil {
			mainLogger.Fatal("Failed to initialize TURN service", zap.Error(err))
		}

		// Start TURN server in a goroutine
		go func() {
			if err := turnService.Start(); err != nil {
				mainLogger.Error("Failed to start TURN server", zap.Error(err))
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
		mainLogger.Fatal("Failed to initialize server", zap.Error(err))
	}

	// Setup middleware
	server.SetupMiddleware()

	// Setup routes
	routes.SetupRoutes(server.App(), h, hub, authService)

	// Initialize Sentry
	if sentryService != nil {
		// Füge Sentry Middleware hinzu
		server.App().Use(sentryService.Middleware())
	}

	// Start server
	if err := server.Start(); err != nil {
		mainLogger.Fatal("Failed to start server", zap.Error(err))
	}
}
