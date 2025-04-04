package handlers

import (
	"strconv"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type FriendHandler struct {
	friendService *services.FriendService
}

func NewFriendHandler(friendService *services.FriendService) *FriendHandler {
	return &FriendHandler{
		friendService: friendService,
	}
}

func (h *FriendHandler) GetFriends(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	friends, err := h.friendService.GetFriends(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(friends)
}

func (h *FriendHandler) GetFriendRequests(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	requests, err := h.friendService.GetFriendRequests(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(requests)
}

func (h *FriendHandler) SendFriendRequest(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var req struct {
		UserID uint `json:"userId"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	if err := h.friendService.SendFriendRequest(userID, req.UserID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Freundschaftsanfrage gesendet",
	})
}

func (h *FriendHandler) AcceptFriendRequest(c *fiber.Ctx) error {
	requestID, err := strconv.ParseUint(c.Params("requestId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage-ID",
		})
	}

	if err := h.friendService.AcceptFriendRequest(uint(requestID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Freundschaftsanfrage angenommen",
	})
}

func (h *FriendHandler) RejectFriendRequest(c *fiber.Ctx) error {
	requestID, err := strconv.ParseUint(c.Params("requestId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage-ID",
		})
	}

	if err := h.friendService.RejectFriendRequest(uint(requestID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Freundschaftsanfrage abgelehnt",
	})
}

func (h *FriendHandler) RemoveFriend(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	friendID, err := strconv.ParseUint(c.Params("friendId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Freund-ID",
		})
	}

	if err := h.friendService.RemoveFriend(userID, uint(friendID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Freund entfernt",
	})
}
