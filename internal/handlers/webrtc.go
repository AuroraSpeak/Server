package handlers

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/types"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"go.uber.org/zap"
)

type WebRTCHandler struct {
	webrtcService types.WebRTCService
	logger        *zap.Logger
	clients       map[string]*websocket.Conn
	clientsMutex  sync.RWMutex
	rooms         map[string]map[string]bool // roomID -> map[clientID]bool
	roomsMutex    sync.RWMutex
}

func NewWebRTCHandler(webrtcService types.WebRTCService) *WebRTCHandler {
	return &WebRTCHandler{
		webrtcService: webrtcService,
		logger:        logging.NewLogger("webrtc"),
		clients:       make(map[string]*websocket.Conn),
		rooms:         make(map[string]map[string]bool),
	}
}

type WebRTCMessage struct {
	Type   string          `json:"type"`
	From   string          `json:"from"`
	To     string          `json:"to,omitempty"`
	RoomID string          `json:"roomId"`
	Data   json.RawMessage `json:"data"`
}

type ICECandidate struct {
	Candidate     string `json:"candidate"`
	SDPMLineIndex int    `json:"sdpMLineIndex"`
	SDPMid        string `json:"sdpMid"`
}

func (h *WebRTCHandler) HandleWebSocket(c *websocket.Conn) {
	clientID := generateClientID()
	h.registerClient(clientID, c)
	defer h.unregisterClient(clientID)

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

			msg.From = clientID
			if err := h.handleMessage(c, clientID, msg); err != nil {
				h.logger.Error("Fehler beim Verarbeiten der Nachricht",
					zap.Error(err),
					zap.String("clientID", clientID),
					zap.String("messageType", msg.Type),
				)
			}
		}
	}
}

func (h *WebRTCHandler) handleMessage(c *websocket.Conn, clientID string, msg WebRTCMessage) error {
	switch msg.Type {
	case "join":
		return h.handleJoinRoom(clientID, msg.RoomID)

	case "leave":
		return h.handleLeaveRoom(clientID, msg.RoomID)

	case "offer":
		return h.relayMessage(msg)

	case "answer":
		return h.relayMessage(msg)

	case "ice-candidate":
		return h.relayMessage(msg)

	default:
		return fmt.Errorf("unbekannter Nachrichtentyp: %s", msg.Type)
	}
}

func (h *WebRTCHandler) handleJoinRoom(clientID, roomID string) error {
	h.roomsMutex.Lock()
	defer h.roomsMutex.Unlock()

	if _, exists := h.rooms[roomID]; !exists {
		h.rooms[roomID] = make(map[string]bool)
	}

	h.rooms[roomID][clientID] = true

	// Benachrichtige andere Clients im Raum
	for otherClientID := range h.rooms[roomID] {
		if otherClientID != clientID {
			msg := WebRTCMessage{
				Type:   "user-joined",
				From:   clientID,
				RoomID: roomID,
			}
			h.sendToClient(otherClientID, msg)
		}
	}

	return nil
}

func (h *WebRTCHandler) handleLeaveRoom(clientID, roomID string) error {
	h.roomsMutex.Lock()
	defer h.roomsMutex.Unlock()

	if room, exists := h.rooms[roomID]; exists {
		delete(room, clientID)
		if len(room) == 0 {
			delete(h.rooms, roomID)
		}

		// Benachrichtige andere Clients im Raum
		for otherClientID := range room {
			msg := WebRTCMessage{
				Type:   "user-left",
				From:   clientID,
				RoomID: roomID,
			}
			h.sendToClient(otherClientID, msg)
		}
	}

	return nil
}

func (h *WebRTCHandler) relayMessage(msg WebRTCMessage) error {
	if msg.To == "" {
		return fmt.Errorf("Ziel-Client nicht angegeben")
	}

	return h.sendToClient(msg.To, msg)
}

func (h *WebRTCHandler) sendToClient(clientID string, msg WebRTCMessage) error {
	h.clientsMutex.RLock()
	conn, exists := h.clients[clientID]
	h.clientsMutex.RUnlock()

	if !exists {
		return fmt.Errorf("Client %s nicht gefunden", clientID)
	}

	messageBytes, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("Fehler beim Serialisieren der Nachricht: %v", err)
	}

	return conn.WriteMessage(websocket.TextMessage, messageBytes)
}

func (h *WebRTCHandler) registerClient(clientID string, conn *websocket.Conn) {
	h.clientsMutex.Lock()
	defer h.clientsMutex.Unlock()
	h.clients[clientID] = conn
}

func (h *WebRTCHandler) unregisterClient(clientID string) {
	h.clientsMutex.Lock()
	defer h.clientsMutex.Unlock()

	// Entferne Client aus allen Räumen
	h.roomsMutex.Lock()
	for roomID, room := range h.rooms {
		if room[clientID] {
			delete(room, clientID)
			if len(room) == 0 {
				delete(h.rooms, roomID)
			}
		}
	}
	h.roomsMutex.Unlock()

	delete(h.clients, clientID)
}

func generateClientID() string {
	return fmt.Sprintf("client-%d", time.Now().UnixNano())
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
