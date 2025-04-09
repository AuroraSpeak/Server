package handlers

import (
	"strings"

	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type MessageHandler struct {
	messageService *services.MessageService
	serverService  *services.ServerService
	logger         *zap.Logger
}

func NewMessageHandler(messageService *services.MessageService, serverService *services.ServerService) *MessageHandler {
	return &MessageHandler{
		messageService: messageService,
		serverService:  serverService,
		logger:         logging.NewLogger("message"),
	}
}

type CreateMessageRequest struct {
	Content  string `json:"content"`
	Mentions []uint `json:"mentions"`
}

func (h *MessageHandler) CreateMessage(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("channelId")
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	// Parse multipart form
	if form, err := c.MultipartForm(); err == nil {
		// Verarbeite Anhänge
		files := form.File["attachments"]
		for _, file := range files {
			attachment := &models.Attachment{
				Type: getFileType(file.Filename),
				Name: file.Filename,
				Size: file.Size,
			}

			// Speichere die Datei und setze die URL
			// TODO: Implementiere Datei-Upload-Logik

			if err := h.messageService.AddAttachment(attachment); err != nil {
				h.logger.Error("Fehler beim Speichern des Anhangs",
					zap.Error(err),
				)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to save attachment",
				})
			}
		}
	}

	var req CreateMessageRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Nachrichtenanfrage",
			zap.Error(err),
			zap.Int("channelId", channelID),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Neue Nachricht wird erstellt",
		zap.Uint("userID", userID),
		zap.Int("channelID", channelID),
	)

	channel, err := h.messageService.GetChannel(uint(channelID))
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
		h.logger.Warn("Nicht autorisierter Nachrichtenversuch",
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
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
		h.logger.Error("Fehler beim Erstellen der Nachricht",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Int("channelID", channelID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create message",
		})
	}

	// Verarbeite Erwähnungen
	for _, mentionedUserID := range req.Mentions {
		if err := h.messageService.AddMention(message.ID, mentionedUserID); err != nil {
			h.logger.Error("Fehler beim Hinzufügen der Erwähnung",
				zap.Error(err),
			)
		}
	}

	h.logger.Info("Nachricht erfolgreich erstellt",
		zap.Uint("messageID", message.ID),
		zap.Uint("userID", userID),
		zap.Int("channelID", channelID),
	)

	return c.Status(fiber.StatusCreated).JSON(message)
}

func (h *MessageHandler) GetChannelMessages(c *fiber.Ctx) error {
	channelID, err := c.ParamsInt("channelId")
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid channel ID",
		})
	}

	limit := c.QueryInt("limit", 50)
	if limit > 100 {
		limit = 100
	}

	userID := c.Locals("userID").(uint)
	h.logger.Debug("Nachrichten werden abgerufen",
		zap.Uint("userID", userID),
		zap.Int("channelID", channelID),
		zap.Int("limit", limit),
	)

	channel, err := h.messageService.GetChannel(uint(channelID))
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
		h.logger.Warn("Nicht autorisierter Zugriffsversuch auf Nachrichten",
			zap.Uint("userID", userID),
			zap.Uint("serverID", channel.ServerID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not a member of this server",
		})
	}

	messages, err := h.messageService.GetChannelMessages(uint(channelID), limit)
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der Nachrichten",
			zap.Error(err),
			zap.Int("channelID", channelID),
			zap.Int("limit", limit),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get channel messages",
		})
	}

	h.logger.Debug("Nachrichten erfolgreich abgerufen",
		zap.Int("channelID", channelID),
		zap.Int("messageCount", len(messages)),
	)

	return c.JSON(messages)
}

type UpdateMessageRequest struct {
	Content  string `json:"content"`
	Mentions []uint `json:"mentions"`
}

func (h *MessageHandler) UpdateMessage(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Nachrichten-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	var req UpdateMessageRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Update-Anfrage",
			zap.Error(err),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Nachricht wird aktualisiert",
		zap.Uint("userID", userID),
		zap.Int("messageID", messageID),
	)

	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		h.logger.Error("Nachricht nicht gefunden",
			zap.Error(err),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Message not found",
		})
	}

	if message.UserID != userID {
		h.logger.Warn("Nicht autorisierter Update-Versuch",
			zap.Uint("userID", userID),
			zap.Uint("messageUserID", message.UserID),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to edit this message",
		})
	}

	updates := map[string]interface{}{
		"content": req.Content,
	}

	if err := h.messageService.UpdateMessage(uint(messageID), updates); err != nil {
		h.logger.Error("Fehler beim Aktualisieren der Nachricht",
			zap.Error(err),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update message",
		})
	}

	h.logger.Info("Nachricht erfolgreich aktualisiert",
		zap.Int("messageID", messageID),
	)

	return c.SendStatus(fiber.StatusOK)
}

func (h *MessageHandler) DeleteMessage(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Nachrichten-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Nachricht wird gelöscht",
		zap.Uint("userID", userID),
		zap.Int("messageID", messageID),
	)

	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		h.logger.Error("Nachricht nicht gefunden",
			zap.Error(err),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Message not found",
		})
	}

	if message.UserID != userID {
		h.logger.Warn("Nicht autorisierter Löschversuch",
			zap.Uint("userID", userID),
			zap.Uint("messageUserID", message.UserID),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to delete this message",
		})
	}

	if err := h.messageService.DeleteMessage(uint(messageID)); err != nil {
		h.logger.Error("Fehler beim Löschen der Nachricht",
			zap.Error(err),
			zap.Int("messageID", messageID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete message",
		})
	}

	h.logger.Info("Nachricht erfolgreich gelöscht",
		zap.Int("messageID", messageID),
	)

	return c.SendStatus(fiber.StatusOK)
}

type ReactionRequest struct {
	Emoji string `json:"emoji"`
}

func (h *MessageHandler) AddReaction(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Nachrichten-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	var req ReactionRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Reaktionsanfrage",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	if err := h.messageService.AddReaction(uint(messageID), userID, req.Emoji); err != nil {
		h.logger.Error("Fehler beim Hinzufügen der Reaktion",
			zap.Error(err),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add reaction",
		})
	}

	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der aktualisierten Nachricht",
			zap.Error(err),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get updated message",
		})
	}

	return c.JSON(message)
}

func (h *MessageHandler) RemoveReaction(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Nachrichten-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	emoji := c.Params("emoji")
	if emoji == "" {
		h.logger.Error("Kein Emoji angegeben")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No emoji specified",
		})
	}

	userID := c.Locals("userID").(uint)
	if err := h.messageService.RemoveReaction(uint(messageID), userID, emoji); err != nil {
		h.logger.Error("Fehler beim Entfernen der Reaktion",
			zap.Error(err),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove reaction",
		})
	}

	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der aktualisierten Nachricht",
			zap.Error(err),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get updated message",
		})
	}

	return c.JSON(message)
}

func getFileType(filename string) string {
	// Einfache Implementierung - sollte in der Produktion verbessert werden
	if strings.HasSuffix(strings.ToLower(filename), ".jpg") ||
		strings.HasSuffix(strings.ToLower(filename), ".jpeg") ||
		strings.HasSuffix(strings.ToLower(filename), ".png") ||
		strings.HasSuffix(strings.ToLower(filename), ".gif") {
		return "image"
	}
	return "file"
}

func (h *MessageHandler) GetMessage(c *fiber.Ctx) error {
	messageID, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Nachrichten-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	message, err := h.messageService.GetMessage(uint(messageID))
	if err != nil {
		h.logger.Error("Nachricht nicht gefunden",
			zap.Error(err),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Message not found",
		})
	}

	return c.JSON(message)
}
