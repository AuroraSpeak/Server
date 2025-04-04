package handlers

import (
	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type ChannelHandler struct {
	channelService *services.ChannelService
	serverService  *services.ServerService
	logger         *zap.Logger
}

func NewChannelHandler(channelService *services.ChannelService, serverService *services.ServerService) *ChannelHandler {
	return &ChannelHandler{
		channelService: channelService,
		serverService:  serverService,
		logger:         logging.NewLogger("channel"),
	}
}

type CreateChannelRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
}

func (h *ChannelHandler) CreateChannel(c *fiber.Ctx) error {
	serverID, err := c.ParamsInt("serverId")
	if err != nil {
		h.logger.Error("Ungültige Server-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	var req CreateChannelRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Kanal-Erstellungsanfrage",
			zap.Error(err),
			zap.Int("serverID", serverID),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Neuer Kanal wird erstellt",
		zap.Uint("userID", userID),
		zap.Int("serverID", serverID),
		zap.String("channelName", req.Name),
	)

	isMember, err := h.serverService.IsMember(uint(serverID), userID)
	if err != nil {
		h.logger.Error("Fehler bei der Überprüfung der Server-Mitgliedschaft",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Int("serverID", serverID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		h.logger.Warn("Nicht autorisierter Kanal-Erstellungsversuch",
			zap.Uint("userID", userID),
			zap.Int("serverID", serverID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	channel := &models.Channel{
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		ServerID:    uint(serverID),
	}

	if err := h.channelService.CreateChannel(channel); err != nil {
		h.logger.Error("Fehler beim Erstellen des Kanals",
			zap.Error(err),
			zap.Int("serverID", serverID),
			zap.String("channelName", req.Name),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create channel",
		})
	}

	h.logger.Info("Kanal erfolgreich erstellt",
		zap.Uint("channelID", channel.ID),
		zap.Int("serverID", serverID),
		zap.String("channelName", req.Name),
	)

	return c.Status(fiber.StatusCreated).JSON(channel)
}

func (h *ChannelHandler) GetChannel(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Debug("Kanal wird abgerufen",
		zap.Uint("userID", userID),
		zap.Int("channelID", channelID),
	)

	channel, err := h.channelService.GetChannel(uint(channelID))
	if err != nil {
		h.logger.Error("Kanal nicht gefunden",
			zap.Error(err),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.serverService.IsMember(channel.ServerID, userID)
	if err != nil {
		h.logger.Error("Fehler bei der Überprüfung der Server-Mitgliedschaft",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		h.logger.Warn("Nicht autorisierter Kanal-Zugriffsversuch",
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	return c.JSON(channel)
}

func (h *ChannelHandler) GetServerChannels(c *fiber.Ctx) error {
	serverID, err := c.ParamsInt("serverId")
	if err != nil {
		h.logger.Error("Ungültige Server-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Debug("Server-Kanäle werden abgerufen",
		zap.Uint("userID", userID),
		zap.Int("serverID", serverID),
	)

	isMember, err := h.serverService.IsMember(uint(serverID), userID)
	if err != nil {
		h.logger.Error("Fehler bei der Überprüfung der Server-Mitgliedschaft",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Int("serverID", serverID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		h.logger.Warn("Nicht autorisierter Zugriffsversuch auf Server-Kanäle",
			zap.Uint("userID", userID),
			zap.Int("serverID", serverID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	channels, err := h.channelService.GetServerChannels(uint(serverID))
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der Server-Kanäle",
			zap.Error(err),
			zap.Int("serverID", serverID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get server channels",
		})
	}

	h.logger.Debug("Server-Kanäle erfolgreich abgerufen",
		zap.Int("serverID", serverID),
		zap.Int("channelCount", len(channels)),
	)

	return c.JSON(channels)
}

type UpdateChannelRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ChannelHandler) UpdateChannel(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	var req UpdateChannelRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Kanal-Update-Anfrage",
			zap.Error(err),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Kanal wird aktualisiert",
		zap.Uint("userID", userID),
		zap.Int("channelID", channelID),
	)

	channel, err := h.channelService.GetChannel(uint(channelID))
	if err != nil {
		h.logger.Error("Kanal nicht gefunden",
			zap.Error(err),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.serverService.IsMember(channel.ServerID, userID)
	if err != nil {
		h.logger.Error("Fehler bei der Überprüfung der Server-Mitgliedschaft",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		h.logger.Warn("Nicht autorisierter Kanal-Update-Versuch",
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	updates := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
	}

	if err := h.channelService.UpdateChannel(uint(channelID), updates); err != nil {
		h.logger.Error("Fehler beim Aktualisieren des Kanals",
			zap.Error(err),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update channel",
		})
	}

	h.logger.Info("Kanal erfolgreich aktualisiert",
		zap.Int("channelID", channelID),
	)

	return c.SendStatus(fiber.StatusOK)
}

func (h *ChannelHandler) DeleteChannel(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Kanal wird gelöscht",
		zap.Uint("userID", userID),
		zap.Int("channelID", channelID),
	)

	channel, err := h.channelService.GetChannel(uint(channelID))
	if err != nil {
		h.logger.Error("Kanal nicht gefunden",
			zap.Error(err),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.serverService.IsMember(channel.ServerID, userID)
	if err != nil {
		h.logger.Error("Fehler bei der Überprüfung der Server-Mitgliedschaft",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		h.logger.Warn("Nicht autorisierter Kanal-Löschversuch",
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	if err := h.channelService.DeleteChannel(uint(channelID)); err != nil {
		h.logger.Error("Fehler beim Löschen des Kanals",
			zap.Error(err),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete channel",
		})
	}

	h.logger.Info("Kanal erfolgreich gelöscht",
		zap.Int("channelID", channelID),
	)

	return c.SendStatus(fiber.StatusOK)
}
