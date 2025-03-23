package main

import (
	"github.com/AuroraSpeak/Server/config"
	"github.com/AuroraSpeak/Server/handlers"
	"github.com/AuroraSpeak/Server/repository"
	"github.com/AuroraSpeak/Server/routes"
	"github.com/AuroraSpeak/Server/service"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

var ()

func main() {
	godotenv.Load()
	config.ConnectDB()
	app := fiber.New()
	userRepo := repository.NewUserRepo()
	authService := service.NewAuthService(userRepo)
	authHandler := handlers.NewAuthHandler(authService)
	// Routes in extra File
	api := app.Group("/api")
	routes.RegisterUserRoutes(api.Group("/auth"), authHandler)

	// Static files (Vue)
	app.Static("/", "../frontend/dist")

	app.Listen(":8080")
}
