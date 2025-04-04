package handlers

import (
	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	authService *services.AuthService
	logger      *zap.Logger
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		logger:      logging.NewLogger("auth"),
	}
}

func (h *AuthHandler) Service() *services.AuthService {
	return h.authService
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Registrierungsanfrage",
			zap.Error(err),
			zap.String("email", req.Email),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	h.logger.Info("Neue Registrierungsanfrage",
		zap.String("email", req.Email),
	)

	user, err := h.authService.Register(req.Email, req.Password, req.FullName)
	if err != nil {
		h.logger.Error("Fehler bei der Benutzerregistrierung",
			zap.Error(err),
			zap.String("email", req.Email),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to register user",
		})
	}

	h.logger.Info("Benutzer erfolgreich registriert",
		zap.Uint("userID", user.ID),
		zap.String("email", user.Email),
	)

	return c.Status(fiber.StatusCreated).JSON(user.ToResponse())
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Login-Anfrage",
			zap.Error(err),
			zap.String("email", req.Email),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	h.logger.Info("Login-Versuch",
		zap.String("email", req.Email),
	)

	token, user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		h.logger.Warn("Fehlgeschlagener Login-Versuch",
			zap.Error(err),
			zap.String("email", req.Email),
		)
		status := fiber.StatusUnauthorized
		errorMessage := err.Error()

		// Spezifische Fehlermeldungen für verschiedene Szenarien
		switch errorMessage {
		case "user not found":
			errorMessage = "No account found with this email address"
		case "invalid password":
			errorMessage = "Incorrect password"
		case "account is deactivated":
			errorMessage = "Your account has been deactivated"
		case "database error":
			status = fiber.StatusInternalServerError
			errorMessage = "An internal server error occurred"
		}

		return c.Status(status).JSON(fiber.Map{
			"error": errorMessage,
		})
	}

	h.logger.Info("Erfolgreicher Login",
		zap.Uint("userID", user.ID),
		zap.String("email", user.Email),
	)

	return c.JSON(fiber.Map{
		"token": token,
		"user":  user.ToResponse(),
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	h.logger.Debug("Benutzerinformationen angefordert",
		zap.Uint("userID", userID),
	)

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der Benutzerinformationen",
			zap.Error(err),
			zap.Uint("userID", userID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user information",
		})
	}

	return c.JSON(user.ToResponse())
}
