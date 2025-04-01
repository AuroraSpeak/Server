package handlers

import (
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type WebRTCHandler struct {
	webrtcService *services.WebRTCService
	serverService *services.ServerService
}

func NewWebRTCHandler(webrtcService *services.WebRTCService, serverService *services.ServerService) *WebRTCHandler {
	return &WebRTCHandler{
		webrtcService: webrtcService,
		serverService: serverService,
	}
}

func (h *WebRTCHandler) CreateOffer(c *fiber.Ctx) error {
	var req services.OfferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.serverService.GetChannel(req.ChannelID)
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

	offer, err := h.webrtcService.CreateOffer(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create offer",
		})
	}

	return c.JSON(offer)
}

func (h *WebRTCHandler) CreateAnswer(c *fiber.Ctx) error {
	var req services.OfferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.serverService.GetChannel(req.ChannelID)
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

	answer, err := h.webrtcService.CreateAnswer(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create answer",
		})
	}

	return c.JSON(answer)
}

func (h *WebRTCHandler) AddICECandidate(c *fiber.Ctx) error {
	var req services.ICECandidateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(uint)
	channel, err := h.serverService.GetChannel(req.ChannelID)
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

	if err := h.webrtcService.AddICECandidate(req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add ICE candidate",
		})
	}

	return c.SendStatus(fiber.StatusOK)
} 