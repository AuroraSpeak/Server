package handlers

import (
	"encoding/json"

	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/types"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.uber.org/zap"
)

type WebRTCHandler struct {
	webrtcService types.WebRTCService
	logger        *zap.Logger
}

func NewWebRTCHandler(webrtcService types.WebRTCService) *WebRTCHandler {
	return &WebRTCHandler{
		webrtcService: webrtcService,
		logger:        logging.NewLogger("webrtc"),
	}
}

type WebRTCMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func (h *WebRTCHandler) HandleWebSocket(c *websocket.Conn) {
	clientID := c.Query("clientId")
	if clientID == "" {
		h.logger.Error("Keine Client-ID angegeben")
		c.Close()
		return
	}

	h.handleConnection(c, clientID)
}

func (h *WebRTCHandler) handleConnection(c *websocket.Conn, clientID string) {
	defer func() {
		h.logger.Info("WebRTC-Verbindung wird geschlossen",
			zap.String("clientID", clientID),
		)
		h.webrtcService.ClosePeerConnection(clientID)
		c.Close()
	}()

	h.logger.Info("Neue WebRTC-Verbindung hergestellt",
		zap.String("clientID", clientID),
	)

	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				h.logger.Error("Unerwarteter WebSocket-Fehler",
					zap.Error(err),
					zap.String("clientID", clientID),
				)
			} else {
				h.logger.Info("WebSocket-Verbindung geschlossen",
					zap.String("clientID", clientID),
					zap.Error(err),
				)
			}
			break
		}

		if messageType == websocket.TextMessage {
			var msg WebRTCMessage
			if err := json.Unmarshal(message, &msg); err != nil {
				h.logger.Error("Fehler beim Parsen der WebSocket-Nachricht",
					zap.Error(err),
					zap.String("clientID", clientID),
				)
				continue
			}

			h.logger.Debug("WebRTC-Nachricht empfangen",
				zap.String("clientID", clientID),
				zap.String("type", msg.Type),
			)

			if err := h.handleMessage(c, clientID, msg); err != nil {
				h.logger.Error("Fehler beim Verarbeiten der Nachricht",
					zap.Error(err),
					zap.String("clientID", clientID),
					zap.String("type", msg.Type),
				)
			}
		}
	}
}

func (h *WebRTCHandler) handleMessage(c *websocket.Conn, clientID string, msg WebRTCMessage) error {
	switch msg.Type {
	case "offer":
		h.logger.Info("WebRTC-Angebot empfangen",
			zap.String("clientID", clientID),
		)
		return h.webrtcService.HandleOffer(clientID, msg.Payload)
	case "answer":
		h.logger.Info("WebRTC-Antwort empfangen",
			zap.String("clientID", clientID),
		)
		return h.webrtcService.HandleAnswer(clientID, msg.Payload)
	case "ice-candidate":
		h.logger.Debug("ICE-Kandidat empfangen",
			zap.String("clientID", clientID),
		)
		return h.webrtcService.HandleICECandidate(clientID, msg.Payload)
	default:
		h.logger.Warn("Unbekannter Nachrichtentyp",
			zap.String("clientID", clientID),
			zap.String("type", msg.Type),
		)
		return nil
	}
}

func (h *WebRTCHandler) CreateOffer(c *fiber.Ctx) error {
	var req types.OfferRequest
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
	var req types.OfferRequest
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
	var req types.ICECandidateRequest
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
