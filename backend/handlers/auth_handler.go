package handlers

import (
	"github.com/AuroraSpeak/Server/service"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(s service.AuthService) *AuthHandler {
	return &AuthHandler{authService: s}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var data map[string]string
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).SendString("Invalid payload")
	}
	err := h.authService.Register(data["username"], data["password"])
	if err != nil {
		return c.Status(500).SendString("Error registering")
	}
	return c.SendStatus(201)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var data map[string]string
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).SendString("Invalid payload")
	}

	token, err := h.authService.Login(data["username"], data["password"])
	if err != nil {
		return c.Status(401).SendString("Invalid credentials")
	}

	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    token,
		HTTPOnly: true,
		Secure:   false,
	})
	return c.JSON(fiber.Map{"message": "logged in"})
}
