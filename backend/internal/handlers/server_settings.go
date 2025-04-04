package handlers

import (
	"strconv"

	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type ServerSettingsHandler struct {
	settingsService *services.ServerSettingsService
}

func NewServerSettingsHandler(settingsService *services.ServerSettingsService) *ServerSettingsHandler {
	return &ServerSettingsHandler{
		settingsService: settingsService,
	}
}

func (h *ServerSettingsHandler) GetSettings(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	settings, err := h.settingsService.GetSettings(uint(serverID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(settings)
}

func (h *ServerSettingsHandler) UpdateSettings(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	var updates struct {
		Name         string `json:"name"`
		Description  string `json:"description"`
		Verification bool   `json:"verification"`
	}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	settings := &models.ServerSettings{
		Name:         updates.Name,
		Description:  updates.Description,
		Verification: updates.Verification,
	}

	if err := h.settingsService.UpdateSettings(uint(serverID), settings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Einstellungen aktualisiert",
	})
}

func (h *ServerSettingsHandler) UpdateIcon(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	file, err := c.FormFile("icon")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Keine Datei hochgeladen",
		})
	}

	if err := h.settingsService.UpdateIcon(uint(serverID), file); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Server-Icon aktualisiert",
	})
}
