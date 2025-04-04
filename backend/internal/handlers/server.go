package handlers

import (
	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type ServerHandler struct {
	serverService *services.ServerService
	logger        *zap.Logger
}

func NewServerHandler(serverService *services.ServerService) *ServerHandler {
	return &ServerHandler{
		serverService: serverService,
		logger:        logging.NewLogger("server"),
	}
}

type CreateServerRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ServerHandler) CreateServer(c *fiber.Ctx) error {
	var req CreateServerRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Server-Erstellungsanfrage",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Neuer Server wird erstellt",
		zap.Uint("userID", userID),
		zap.String("serverName", req.Name),
	)

	server := &models.Server{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}

	if err := h.serverService.CreateServer(server); err != nil {
		h.logger.Error("Fehler beim Erstellen des Servers",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.String("serverName", req.Name),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create server",
		})
	}

	// Add owner as member
	if err := h.serverService.AddMember(server.ID, userID); err != nil {
		h.logger.Error("Fehler beim Hinzufügen des Besitzers als Mitglied",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint("serverID", server.ID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add owner as member",
		})
	}

	h.logger.Info("Server erfolgreich erstellt",
		zap.Uint("serverID", server.ID),
		zap.Uint("userID", userID),
		zap.String("serverName", req.Name),
	)

	return c.Status(fiber.StatusCreated).JSON(server)
}

func (h *ServerHandler) GetServer(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Server-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Debug("Server wird abgerufen",
		zap.Uint("userID", userID),
		zap.Int("serverID", id),
	)

	server, err := h.serverService.GetServer(uint(id))
	if err != nil {
		h.logger.Error("Server nicht gefunden",
			zap.Error(err),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Server not found",
		})
	}

	return c.JSON(server)
}

func (h *ServerHandler) GetUserServers(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	h.logger.Debug("Benutzer-Server werden abgerufen",
		zap.Uint("userID", userID),
	)

	servers, err := h.serverService.GetUserServers(userID)
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der Benutzer-Server",
			zap.Error(err),
			zap.Uint("userID", userID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user servers",
		})
	}

	h.logger.Debug("Benutzer-Server erfolgreich abgerufen",
		zap.Uint("userID", userID),
		zap.Int("serverCount", len(servers)),
	)

	return c.JSON(servers)
}

type UpdateServerRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ServerHandler) UpdateServer(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Server-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	var req UpdateServerRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Ungültige Server-Update-Anfrage",
			zap.Error(err),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Server wird aktualisiert",
		zap.Uint("userID", userID),
		zap.Int("serverID", id),
	)

	server, err := h.serverService.GetServer(uint(id))
	if err != nil {
		h.logger.Error("Server nicht gefunden",
			zap.Error(err),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Server not found",
		})
	}

	if server.OwnerID != userID {
		h.logger.Warn("Nicht autorisierter Server-Update-Versuch",
			zap.Uint("userID", userID),
			zap.Uint("serverOwnerID", server.OwnerID),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to update this server",
		})
	}

	updates := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
	}

	if err := h.serverService.UpdateServer(uint(id), updates); err != nil {
		h.logger.Error("Fehler beim Aktualisieren des Servers",
			zap.Error(err),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update server",
		})
	}

	h.logger.Info("Server erfolgreich aktualisiert",
		zap.Int("serverID", id),
	)

	return c.SendStatus(fiber.StatusOK)
}

func (h *ServerHandler) DeleteServer(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		h.logger.Error("Ungültige Server-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Server wird gelöscht",
		zap.Uint("userID", userID),
		zap.Int("serverID", id),
	)

	server, err := h.serverService.GetServer(uint(id))
	if err != nil {
		h.logger.Error("Server nicht gefunden",
			zap.Error(err),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Server not found",
		})
	}

	if server.OwnerID != userID {
		h.logger.Warn("Nicht autorisierter Server-Löschversuch",
			zap.Uint("userID", userID),
			zap.Uint("serverOwnerID", server.OwnerID),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to delete this server",
		})
	}

	if err := h.serverService.DeleteServer(uint(id)); err != nil {
		h.logger.Error("Fehler beim Löschen des Servers",
			zap.Error(err),
			zap.Int("serverID", id),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete server",
		})
	}

	h.logger.Info("Server erfolgreich gelöscht",
		zap.Int("serverID", id),
	)

	return c.SendStatus(fiber.StatusOK)
}

func (h *ServerHandler) GetServerStats(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	userID := c.Locals("userID").(uint)
	isMember, err := h.serverService.IsMember(uint(id), userID)
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

	stats, err := h.serverService.GetServerStats(uint(id))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get server stats",
		})
	}

	return c.JSON(stats)
}
