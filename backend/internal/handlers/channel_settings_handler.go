package handlers

import (
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type ChannelSettingsHandler struct {
	service *services.ChannelSettingsService
}

func NewChannelSettingsHandler(service *services.ChannelSettingsService) *ChannelSettingsHandler {
	return &ChannelSettingsHandler{service: service}
}

func (h *ChannelSettingsHandler) GetSettings(c *fiber.Ctx) error {
	channelID := c.Params("id")
	settings, err := h.service.GetSettings(channelID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel settings not found",
		})
	}
	return c.JSON(settings)
}

func (h *ChannelSettingsHandler) UpdateSettings(c *fiber.Ctx) error {
	channelID := c.Params("id")
	var updates models.ChannelSettings
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if err := h.service.UpdateSettings(channelID, &updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update settings",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Settings updated successfully",
	})
}

func (h *ChannelSettingsHandler) GetPermissionOverwrites(c *fiber.Ctx) error {
	channelID := c.Params("id")
	overwrites, err := h.service.GetPermissionOverwrites(channelID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get permission overwrites",
		})
	}
	return c.JSON(overwrites)
}

func (h *ChannelSettingsHandler) UpdatePermissionOverwrite(c *fiber.Ctx) error {
	overwriteID := c.Params("id")
	var updates models.PermissionOverwrite
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if err := h.service.UpdatePermissionOverwrite(overwriteID, &updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update permission overwrite",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Permission overwrite updated successfully",
	})
}

func (h *ChannelSettingsHandler) DeletePermissionOverwrite(c *fiber.Ctx) error {
	overwriteID := c.Params("id")
	if err := h.service.DeletePermissionOverwrite(overwriteID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete permission overwrite",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Permission overwrite deleted successfully",
	})
}

func (h *ChannelSettingsHandler) CreatePermissionOverwrite(c *fiber.Ctx) error {
	var overwrite models.PermissionOverwrite
	if err := c.BodyParser(&overwrite); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if err := h.service.CreatePermissionOverwrite(&overwrite); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create permission overwrite",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(overwrite)
}
