package handlers

import (
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type ChannelHandler struct {
	channelService *services.ChannelService
	serverService  *services.ServerService
}

func NewChannelHandler(channelService *services.ChannelService, serverService *services.ServerService) *ChannelHandler {
	return &ChannelHandler{
		channelService: channelService,
		serverService:  serverService,
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	var req CreateChannelRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	isMember, err := h.serverService.IsMember(uint(serverID), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create channel",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(channel)
}

func (h *ChannelHandler) GetChannel(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.channelService.GetChannel(uint(channelID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.serverService.IsMember(channel.ServerID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	return c.JSON(channel)
}

func (h *ChannelHandler) GetServerChannels(c *fiber.Ctx) error {
	serverID, err := c.ParamsInt("serverId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	userID := c.Locals("userID").(uint)
	isMember, err := h.serverService.IsMember(uint(serverID), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	channels, err := h.channelService.GetServerChannels(uint(serverID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get server channels",
		})
	}

	return c.JSON(channels)
}

type UpdateChannelRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ChannelHandler) UpdateChannel(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	var req UpdateChannelRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.channelService.GetChannel(uint(channelID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.serverService.IsMember(channel.ServerID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	updates := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
	}

	if err := h.channelService.UpdateChannel(uint(channelID), updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update channel",
		})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *ChannelHandler) DeleteChannel(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.channelService.GetChannel(uint(channelID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.serverService.IsMember(channel.ServerID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check membership",
		})
	}

	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	if err := h.channelService.DeleteChannel(uint(channelID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete channel",
		})
	}

	return c.SendStatus(fiber.StatusOK)
} 