package handlers

import (
	"log"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/websocket/v2"
)

type WebSocketHandler struct {
	webrtcService *services.WebRTCService
}

func NewWebSocketHandler(webrtcService *services.WebRTCService) *WebSocketHandler {
	return &WebSocketHandler{
		webrtcService: webrtcService,
	}
}

func (h *WebSocketHandler) HandleWebSocket(c *websocket.Conn) {
	serverID := c.Params("serverId")
	if serverID == "" {
		log.Printf("Server ID fehlt")
		return
	}

	// Add client to WebRTC service
	client := &services.WebRTCClient{
		Conn:     c,
		ServerID: serverID,
	}
	h.webrtcService.AddClient(client)

	// Handle messages
	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unerwarteter WebSocket-Fehler: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			h.webrtcService.HandleMessage(client, message)
		}
	}

	// Cleanup
	h.webrtcService.RemoveClient(client)
}
