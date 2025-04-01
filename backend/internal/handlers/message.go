package handlers

import (
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type MessageHandler struct {
	messageService *services.MessageService
	serverService  *services.ServerService
}

func NewMessageHandler(messageService *services.MessageService, serverService *services.ServerService) *MessageHandler {
	return &MessageHandler{
		messageService: messageService,
		serverService:  serverService,
	}
}

type CreateMessageRequest struct {
	Content string `json:"content"`
}

func (h *MessageHandler) CreateMessage(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("channelId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	var req CreateMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.messageService.GetChannel(uint(channelID))
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

	message := &models.Message{
		Content:   req.Content,
		UserID:    userID,
		ChannelID: uint(channelID),
	}

	if err := h.messageService.CreateMessage(message); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create message",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(message)
}

func (h *MessageHandler) GetChannelMessages(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("channelId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	limit := c.QueryInt("limit", 50)
	if limit > 100 {
		limit = 100
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.messageService.GetChannel(uint(channelID))
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

	messages, err := h.messageService.GetChannelMessages(uint(channelID), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get channel messages",
		})
	}

	return c.JSON(messages)
}

type UpdateMessageRequest struct {
	Content string `json:"content"`
}

func (h *MessageHandler) UpdateMessage(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	var req UpdateMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Message not found",
		})
	}

	if message.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to edit this message",
		})
	}

	updates := map[string]interface{}{
		"content": req.Content,
	}

	if err := h.messageService.UpdateMessage(uint(messageID), updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update message",
		})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *MessageHandler) DeleteMessage(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	userID := c.Locals("userID").(uint)
	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Message not found",
		})
	}

	if message.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to delete this message",
		})
	}

	if err := h.messageService.DeleteMessage(uint(messageID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete message",
		})
	}

	return c.SendStatus(fiber.StatusOK)
} 