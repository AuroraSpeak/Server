package config

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

type Server struct {
	app    *fiber.App
	db     *gorm.DB
	config *Config
}

func NewServer(db *gorm.DB, config *Config) *Server {
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
	}
}

func (s *Server) App() *fiber.App {
	return s.app
}

func (s *Server) SetupMiddleware() {
	s.app.Use(recover.New())
	s.app.Use(logger.New())

	// CORS-Middleware
	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Connection, Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
		MaxAge:           300,
		ExposeHeaders:    "Content-Length, Content-Type, Sec-WebSocket-Accept",
	}))

	// Metrics endpoint
	s.app.Get("/metrics", monitor.New())
}

func (s *Server) Start() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return s.app.Listen(":" + port)
}
