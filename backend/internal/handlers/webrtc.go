package handlers

import (
	"encoding/json"
	"log"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/pion/webrtc/v3"
	"gorm.io/gorm"
)

type WebRTCHandler struct {
	db      *gorm.DB
	service *services.WebRTCService
}

type WebRTCMessage struct {
	Type      string                     `json:"type"`
	ServerID  string                     `json:"serverId"`
	UserID    string                     `json:"userId"`
	Offer     *webrtc.SessionDescription `json:"offer,omitempty"`
	Answer    *webrtc.SessionDescription `json:"answer,omitempty"`
	Candidate *webrtc.ICECandidateInit   `json:"candidate,omitempty"`
}

func NewWebRTCHandler(db *gorm.DB, service *services.WebRTCService) *WebRTCHandler {
	return &WebRTCHandler{
		db:      db,
		service: service,
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
	channel, err := h.service.GetChannel(req.ChannelID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.service.IsMember(channel.ServerID, userID)
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

	offer, err := h.service.CreateOffer(req)
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
	channel, err := h.service.GetChannel(req.ChannelID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.service.IsMember(channel.ServerID, userID)
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

	answer, err := h.service.CreateAnswer(req)
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
	channel, err := h.service.GetChannel(req.ChannelID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Channel not found",
		})
	}

	isMember, err := h.service.IsMember(channel.ServerID, userID)
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

	if err := h.service.AddICECandidate(req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add ICE candidate",
		})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *WebRTCHandler) HandleWebSocket(c *websocket.Conn) {
	defer c.Close()

	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			var msg WebRTCMessage
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Failed to unmarshal message: %v", err)
				continue
			}

			switch msg.Type {
			case "offer":
				answer, err := h.service.HandleOffer(msg.ServerID, msg.UserID, *msg.Offer)
				if err != nil {
					log.Printf("Failed to handle offer: %v", err)
					continue
				}

				response := WebRTCMessage{
					Type:     "answer",
					ServerID: msg.ServerID,
					UserID:   msg.UserID,
					Answer:   answer,
				}

				if err := c.WriteJSON(response); err != nil {
					log.Printf("Failed to send answer: %v", err)
				}

			case "candidate":
				if err := h.service.HandleICECandidate(msg.ServerID, msg.UserID, *msg.Candidate); err != nil {
					log.Printf("Failed to handle ICE candidate: %v", err)
				}

			case "disconnect":
				if err := h.service.ClosePeerConnection(msg.ServerID, msg.UserID); err != nil {
					log.Printf("Failed to close peer connection: %v", err)
				}
			}
		}
	}
}
