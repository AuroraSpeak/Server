package websocket

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

const (
	// Zeit, die der Server auf eine Pong-Antwort wartet
	wsPongWait = 90 * time.Second

	// Zeit zwischen Pings
	wsPingPeriod = 15 * time.Second

	// Zeit, die der Server auf eine Schreiboperation wartet
	wsWriteWait = 15 * time.Second
)

func SetupWebSocketRoutes(app *fiber.App, hub *Hub, authService *services.AuthService) {
	logger := NewLogger("WebSocketRouter")
	logger.Info("Einrichten der WebSocket-Routen")

	// CORS-Konfiguration für WebSocket-Verbindungen
	app.Use("/ws/*", func(c *fiber.Ctx) error {
		// Erlaube nur spezifische Origins
		allowedOrigins := []string{
			"http://localhost:5173",
			"http://localhost:8080",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:8080",
			"https://your-production-domain.com",
		}

		origin := c.Get("Origin")
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Unerlaubter Origin",
			})
		}

		c.Set("Access-Control-Allow-Origin", origin)
		c.Set("Access-Control-Allow-Credentials", "true")
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent)
		}

		return c.Next()
	})

	// WebSocket-Routen nach den CORS-Einstellungen
	wsGroup := app.Group("/ws")

	// Authentifizierungs-Middleware für WebSocket-Verbindungen
	wsGroup.Use(func(c *fiber.Ctx) error {
		// Versuche zuerst das Token aus dem Query-Parameter zu holen
		token := c.Query("token")

		// Falls kein Token im Query-Parameter, versuche es aus dem Authorization-Header
		if token == "" {
			auth := c.Get("Authorization")
			if auth != "" {
				parts := strings.Split(auth, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token = parts[1]
				}
			}
		}

		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Kein Token angegeben",
			})
		}

		claims, err := authService.ValidateToken(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültiges Token",
			})
		}

		userID, ok := claims["sub"].(float64)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültige Token-Claims",
			})
		}

		c.Locals("userID", uint(userID))
		return c.Next()
	})

	// Channel-spezifische WebSocket-Verbindung
	wsGroup.Get("/channels/:channelId", websocket.New(func(c *websocket.Conn) {
		// WebSocket-Verbindungshandler
		channelID := c.Params("channelId")
		userID := c.Locals("userID").(uint)

		// Verbindungsvalidierung
		if channelID == "" || userID == 0 {
			c.WriteJSON(fiber.Map{
				"error": "Ungültige Parameter",
			})
			return
		}

		// Client erstellen
		client := &Client{
			ID:        fmt.Sprintf("%d", userID),
			ChannelID: channelID,
			Conn:      c,
			Hub:       hub,
			send:      make(chan []byte, 256),
			log:       NewLogger(fmt.Sprintf("Client-%d", userID)),
			done:      make(chan struct{}),
		}

		// Verbindungs-Timeouts setzen
		c.SetReadLimit(512 * 1024) // 512KB
		c.SetReadDeadline(time.Now().Add(wsPongWait))
		c.SetPongHandler(func(string) error {
			c.SetReadDeadline(time.Now().Add(wsPongWait))
			return nil
		})

		// Client im Hub registrieren
		hub.register <- client
		logger.Info("Client im Hub registriert: UserID=%d, ChannelID=%s", userID, channelID)

		// Goroutines für Message-Handling starten
		go client.ReadPump()
		go client.WritePump()

		// Warte auf das done-Signal
		<-client.done

		// Verbindung schließen
		c.Close()
	}))
}

// Hilfsfunktionen
func setupConnectionTimeouts(c *websocket.Conn) {
	c.SetPongHandler(func(string) error {
		c.SetReadDeadline(time.Now().Add(wsPongWait))
		return nil
	})
	c.SetReadDeadline(time.Now().Add(wsPongWait))
}

func handleClientMessages(client *Client, c *websocket.Conn, hub *Hub, logger *Logger) {
	defer func() {
		hub.unregister <- client
		logger.Info("Client %s: WebSocket-Verbindung wird geschlossen", client.ID)
		c.Close()
	}()

	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Error("Unerwarteter WebSocket-Fehler: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			handleTextMessage(message, client, hub, logger)
		}
	}
}

func handleTextMessage(message []byte, client *Client, hub *Hub, logger *Logger) {
	var msg Message
	if err := json.Unmarshal(message, &msg); err != nil {
		logger.Error("Fehler beim Parsen der Nachricht: %v", err)
		return
	}

	// Ping/Pong handling
	if msg.Type == MessageTypePing {
		logger.Debug("Ping empfangen von Client %s", client.ID)
		sendPongResponse(client, logger)
		return
	}

	// Validiere die Nachricht
	switch msg.Type {
	case MessageTypeCallRequest:
		if msg.RoomID == "" {
			logger.Error("Anrufanfrage ohne RoomID")
			return
		}
	case MessageTypeOffer, MessageTypeAnswer, MessageTypeIceCandidate:
		if msg.TargetUserID == "" {
			logger.Error("WebRTC-Nachricht ohne TargetUserID")
			return
		}
	}

	// Füge die UserID des Absenders zur Nachricht hinzu
	msg.Data = map[string]interface{}{
		"fromUserID": client.ID,
		"data":       msg.Data,
	}

	// Serialisiere die aktualisierte Nachricht
	updatedMessage, err := json.Marshal(msg)
	if err != nil {
		logger.Error("Fehler beim Serialisieren der aktualisierten Nachricht: %v", err)
		return
	}

	// Nachricht an alle Clients im Channel senden
	hub.Broadcast <- updatedMessage
}

func sendPongResponse(client *Client, logger *Logger) {
	response := Message{
		Type: MessageTypePong,
	}
	responseBytes, err := json.Marshal(response)
	if err != nil {
		logger.Error("Fehler beim Erstellen der Pong-Antwort: %v", err)
		return
	}
	client.send <- responseBytes
}
