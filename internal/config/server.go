package config

import (
	"os"

	"github.com/auraspeak/backend/internal/csrf"
	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/middleware"
	"github.com/auraspeak/backend/internal/types"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Server struct {
	app    *fiber.App
	db     *gorm.DB
	config *types.Config
	logger *zap.Logger
}

func NewServer(db *gorm.DB, config *types.Config) (*Server, error) {
	// Initialisiere den Logger
	if err := logging.Init(config.Environment); err != nil {
		return nil, err
	}

	app := fiber.New(fiber.Config{
		AppName:                 "AuraSpeak API",
		EnableTrustedProxyCheck: false,
		ProxyHeader:             "",
		DisableStartupMessage:   false,
		BodyLimit:               10 * 1024 * 1024, // 10MB
		EnablePrintRoutes:       true,             // Debug-Hilfe
	})

	return &Server{
		app:    app,
		db:     db,
		config: config,
		logger: logging.NewLogger("server"),
	}, nil
}

func (s *Server) App() *fiber.App {
	return s.app
}

func (s *Server) SetupMiddleware() {
	s.app.Use(recover.New())

	// Fiber Logger Middleware
	s.app.Use(fiberlogger.New(fiberlogger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} | ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Local",
	}))

	// CORS-Middleware
	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173", // Feste Origin für die Entwicklung
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Connection, Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions, X-CSRF-Token",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
		MaxAge:           300,
		ExposeHeaders:    "Content-Length, Content-Type, Sec-WebSocket-Accept",
	}))

	// CSRF-Middleware nur in der Produktionsumgebung aktivieren
	if s.config.Environment == "production" {
		s.app.Use(middleware.CSRFMiddleware(csrf.Config{
			TokenLength:    32,
			CookieName:     "csrf_token",
			HeaderName:     "X-CSRF-Token",
			CookiePath:     "/",
			CookieDomain:   "",
			CookieSecure:   true,
			CookieHTTPOnly: true,
		}))
	}

	// Metrics endpoint
	s.app.Get("/metrics", monitor.New())
}

func (s *Server) Start() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	s.logger.Info("Server wird gestartet",
		zap.String("port", port),
		zap.String("environment", s.config.Environment),
	)

	return s.app.Listen(":" + port)
}
