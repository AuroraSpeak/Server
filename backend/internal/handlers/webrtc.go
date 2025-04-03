package handlers

import (
	"encoding/json"
	"log"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type WebRTCHandler struct {
	webrtcService *services.WebRTCService
}

func NewWebRTCHandler(webrtcService *services.WebRTCService) *WebRTCHandler {
	return &WebRTCHandler{
		webrtcService: webrtcService,
	}
}

type WebRTCMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func (h *WebRTCHandler) HandleWebSocket(c *websocket.Conn) {
	clientID := c.Query("clientId")
	if clientID == "" {
		log.Printf("Keine Client-ID angegeben")
		c.Close()
		return
	}

	h.handleConnection(c, clientID)
}

func (h *WebRTCHandler) handleConnection(c *websocket.Conn, clientID string) {
	defer func() {
		h.webrtcService.ClosePeerConnection(clientID)
		c.Close()
	}()

	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Fehler beim Lesen der WebSocket-Nachricht: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			var msg WebRTCMessage
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Fehler beim Parsen der WebSocket-Nachricht: %v", err)
				continue
			}

			if err := h.handleMessage(c, clientID, msg); err != nil {
				log.Printf("Fehler beim Verarbeiten der Nachricht: %v", err)
			}
		}
	}
}

func (h *WebRTCHandler) handleMessage(c *websocket.Conn, clientID string, msg WebRTCMessage) error {
	switch msg.Type {
	case "offer":
		var offer struct {
			SDP string `json:"sdp"`
		}
		if err := json.Unmarshal(msg.Payload, &offer); err != nil {
			return err
		}
		return h.handleOffer(c, clientID, offer.SDP)

	case "answer":
		var answer struct {
			SDP string `json:"sdp"`
		}
		if err := json.Unmarshal(msg.Payload, &answer); err != nil {
			return err
		}
		return h.handleAnswer(c, clientID, answer.SDP)

	case "ice-candidate":
		var candidate struct {
			Candidate string `json:"candidate"`
		}
		if err := json.Unmarshal(msg.Payload, &candidate); err != nil {
			return err
		}
		return h.handleICECandidate(c, clientID, candidate.Candidate)

	case "ping":
		return h.handlePing(c)

	default:
		log.Printf("Unbekannte Nachricht empfangen: %s", msg.Type)
		return nil
	}
}

func (h *WebRTCHandler) handleOffer(c *websocket.Conn, clientID, sdp string) error {
	answer, err := h.webrtcService.HandleOffer(clientID, sdp)
	if err != nil {
		return err
	}

	response := WebRTCMessage{
		Type:    "answer",
		Payload: json.RawMessage(`{"sdp": "` + answer + `"}`),
	}

	return c.WriteJSON(response)
}

func (h *WebRTCHandler) handleAnswer(c *websocket.Conn, clientID, sdp string) error {
	return h.webrtcService.HandleAnswer(clientID, sdp)
}

func (h *WebRTCHandler) handleICECandidate(c *websocket.Conn, clientID, candidate string) error {
	return h.webrtcService.HandleICECandidate(clientID, candidate)
}

func (h *WebRTCHandler) handlePing(c *websocket.Conn) error {
	response := WebRTCMessage{
		Type:    "pong",
		Payload: json.RawMessage("{}"),
	}
	return c.WriteJSON(response)
}

func (h *WebRTCHandler) CreateOffer(c *fiber.Ctx) error {
	var req services.OfferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	offer, err := h.webrtcService.CreateOffer(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"offer": offer,
	})
}

func (h *WebRTCHandler) CreateAnswer(c *fiber.Ctx) error {
	var req services.OfferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	answer, err := h.webrtcService.CreateAnswer(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"answer": answer,
	})
}

func (h *WebRTCHandler) AddICECandidate(c *fiber.Ctx) error {
	var req services.ICECandidateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	if err := h.webrtcService.AddICECandidate(req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
	})
}
