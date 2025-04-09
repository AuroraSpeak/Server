package websocket

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

const (
	// Zeit, die der Server auf eine Pong-Antwort wartet
	wsPongWait = 60 * time.Second

	// Zeit zwischen Pings
	wsPingPeriod = 30 * time.Second

	// Zeit, die der Server auf eine Schreiboperation wartet
	wsWriteWait = 10 * time.Second
)

func SetupWebSocketRoutes(app *fiber.App, hub *Hub, authService *services.AuthService) {
	logger := NewLogger("WebSocketRouter")
	logger.Info("Einrichten der WebSocket-Routen")

	// WebSocket Middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		logger.Debug("WebSocket-Anfrage empfangen: %s %s", c.Method(), c.Path())

		// CORS-Header für WebSocket-Verbindungen
		c.Set("Access-Control-Allow-Origin", "*") // Erlaube alle Origins für Entwicklung
		c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "*")
		c.Set("Access-Control-Allow-Credentials", "true")
		c.Set("Access-Control-Expose-Headers", "*")

		// Token aus dem Query-Parameter extrahieren
		token := c.Query("token")
		if token == "" {
			logger.Error("Kein Token in der Anfrage")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Kein Token in der Anfrage",
			})
		}

		// Token validieren
		claims, err := authService.ValidateToken(token)
		if err != nil {
			logger.Error("Token ungültig: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültiger Token",
			})
		}

		// UserID aus den Claims extrahieren
		userID, ok := claims["sub"].(float64)
		if !ok {
			logger.Error("Ungültige UserID im Token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Ungültige UserID im Token",
			})
		}

		// Server ID aus dem Query-Parameter extrahieren
		serverID := c.Query("serverId")
		if serverID == "" {
			logger.Error("Keine Server ID in der Anfrage")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Keine Server ID in der Anfrage",
			})
		}

		// Überprüfen, ob der Benutzer Mitglied des Servers ist
		isMember, err := authService.IsMember(serverID, uint(userID))
		if err != nil {
			logger.Error("Fehler beim Überprüfen der Server-Mitgliedschaft: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Interner Server-Fehler",
			})
		}

		if !isMember {
			logger.Error("Benutzer %d ist kein Mitglied des Servers %s", uint(userID), serverID)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Benutzer ist kein Mitglied des Servers",
			})
		}

		logger.Debug("Benutzer %d ist Mitglied des Servers %s", uint(userID), serverID)

		// Setze UserID und ServerID im Kontext
		c.Locals("userID", uint(userID))
		c.Locals("serverID", serverID)

		return c.Next()
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		userID := c.Locals("userID").(uint)
		serverID := c.Locals("serverID").(string)

		logger.Info("Neue WebSocket-Verbindung hergestellt: UserID=%d, ServerID=%s", userID, serverID)

		var wg sync.WaitGroup
		clientDone := make(chan struct{})

		client := &Client{
			ID:   fmt.Sprintf("%d", userID),
			Conn: c,
			Hub:  hub,
			send: make(chan []byte, 256),
			log:  NewLogger(fmt.Sprintf("Client-%d", userID)),
			done: clientDone,
		}

		// Setze Pong-Handler
		c.SetPongHandler(func(string) error {
			c.SetReadDeadline(time.Now().Add(wsPongWait))
			return nil
		})

		// Setze initiales Read-Deadline
		c.SetReadDeadline(time.Now().Add(wsPongWait))

		// Registriere den Client im Hub
		hub.register <- client
		logger.Info("Client im Hub registriert: UserID=%d, ServerID=%s", userID, serverID)

		wg.Add(2) // Für ReadPump und WritePump

		// Starte eine Goroutine für das Schreiben von Nachrichten
		go func() {
			defer wg.Done()
			client.WritePump()
		}()

		// Starte eine Goroutine für das Lesen von Nachrichten
		go func() {
			defer func() {
				wg.Done()
				hub.unregister <- client
				logger.Info("Client %d: WebSocket-Verbindung wird geschlossen", userID)
				c.Close()
			}()

			for {
				select {
				case <-clientDone:
					return
				default:
					messageType, message, err := c.ReadMessage()
					if err != nil {
						if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
							logger.Error("Unerwarteter WebSocket-Fehler: %v", err)
						}
						return
					}

					// Verarbeite die Nachricht
					if messageType == websocket.TextMessage {
						var msg Message
						if err := json.Unmarshal(message, &msg); err != nil {
							logger.Error("Fehler beim Parsen der Nachricht: %v", err)
							continue
						}

						// Verarbeite Ping-Nachrichten
						if msg.Type == MessageTypePing {
							response := Message{
								Type: MessageTypePong,
							}
							responseBytes, err := json.Marshal(response)
							if err != nil {
								logger.Error("Fehler beim Erstellen der Pong-Antwort: %v", err)
								continue
							}
							client.send <- responseBytes
							continue
						}

						// Validiere die Nachricht
						switch msg.Type {
						case MessageTypeCallRequest:
							if msg.RoomID == "" {
								logger.Error("Anrufanfrage ohne RoomID")
								continue
							}
						case MessageTypeOffer, MessageTypeAnswer, MessageTypeIceCandidate:
							if msg.TargetUserID == "" {
								logger.Error("WebRTC-Nachricht ohne TargetUserID")
								continue
							}
						}

						// Füge die UserID des Absenders zur Nachricht hinzu
						msg.Data = map[string]interface{}{
							"fromUserID": userID,
							"data":       msg.Data,
						}

						// Serialisiere die aktualisierte Nachricht
						updatedMessage, err := json.Marshal(msg)
						if err != nil {
							logger.Error("Fehler beim Serialisieren der aktualisierten Nachricht: %v", err)
							continue
						}

						// Sende die Nachricht an den Hub
						hub.broadcast <- updatedMessage
					}
				}
			}
		}()

		// Warte auf Beendigung beider Goroutinen
		wg.Wait()
		logger.Info("Client %d: Alle Goroutinen beendet", userID)
	}))

	logger.Info("WebSocket-Routen erfolgreich eingerichtet")
}
