package routes

import (
	"github.com/AuroraSpeak/Server/handlers"

	"github.com/gofiber/fiber/v2"
)

func RegisterUserRoutes(r fiber.Router, h *handlers.AuthHandler) {
	r.Post("/register", h.Register)
	r.Post("/login", h.Login)
	//r.Post("/logout", h.Logout)
}
