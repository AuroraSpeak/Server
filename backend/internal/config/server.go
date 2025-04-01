package config

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"gorm.io/gorm"
)

type Server struct {
	app    *fiber.App
	db     *gorm.DB
	config *Config
}

func NewServer(db *gorm.DB, config *Config) *Server {
	app := fiber.New(fiber.Config{
		AppName: "AuraSpeak API",
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
	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("CORS_ORIGINS"),
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Metrics endpoint
	s.app.Get("/metrics", monitor.New())

	// WebSocket Middleware
	s.app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
}

func (s *Server) Start() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return s.app.Listen(":" + port)
}
