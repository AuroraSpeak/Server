package handlers

import (
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type ServerHandler struct {
	serverService *services.ServerService
}

func NewServerHandler(serverService *services.ServerService) *ServerHandler {
	return &ServerHandler{
		serverService: serverService,
	}
}

type CreateServerRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ServerHandler) CreateServer(c *fiber.Ctx) error {
	var req CreateServerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	server := &models.Server{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}

	if err := h.serverService.CreateServer(server); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create server",
		})
	}

	// Add owner as member
	if err := h.serverService.AddMember(server.ID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add owner as member",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(server)
}

func (h *ServerHandler) GetServer(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	server, err := h.serverService.GetServer(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Server not found",
		})
	}

	return c.JSON(server)
}

func (h *ServerHandler) GetUserServers(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	servers, err := h.serverService.GetUserServers(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user servers",
		})
	}

	return c.JSON(servers)
}

type UpdateServerRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ServerHandler) UpdateServer(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid server ID",
		})
	}

	var req UpdateServerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
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

	updates := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
	}

	if err := h.serverService.UpdateServer(uint(id), updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update server",
		})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *ServerHandler) DeleteServer(c *fiber.Ctx) error {
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

	if err := h.serverService.DeleteServer(uint(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete server",
		})
	}

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
