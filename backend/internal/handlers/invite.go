package handlers

import (
	"strconv"
	"time"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type InviteHandler struct {
	inviteService *services.InviteService
}

func NewInviteHandler(inviteService *services.InviteService) *InviteHandler {
	return &InviteHandler{
		inviteService: inviteService,
	}
}

func (h *InviteHandler) GetInvites(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	invites, err := h.inviteService.GetInvites(uint(serverID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(invites)
}

func (h *InviteHandler) CreateInvite(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}
	userID := c.Locals("userID").(uint)
	var req struct {
		MaxUses   int    `json:"maxUses"`
		ExpiresIn string `json:"expiresIn"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	// Parse expiresIn
	expiresIn, err := time.ParseDuration(req.ExpiresIn)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Zeitangabe",
		})
	}

	invite, err := h.inviteService.CreateInvite(uint(serverID), userID, req.MaxUses, expiresIn)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(invite)
}

func (h *InviteHandler) UseInvite(c *fiber.Ctx) error {
	code := c.Params("code")
	if err := h.inviteService.UseInvite(code); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Einladungscode verwendet",
	})
}

func (h *InviteHandler) DeleteInvite(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	inviteID, err := strconv.ParseUint(c.Params("inviteId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Einladungs-ID",
		})
	}

	if err := h.inviteService.DeleteInvite(uint(serverID), uint(inviteID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Einladung gelöscht",
	})
}
