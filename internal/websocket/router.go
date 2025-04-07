package websocket

import (
	"encoding/json"
	"fmt"
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

		client := &Client{
			ID:   fmt.Sprintf("%d", userID),
			Conn: c,
			Hub:  hub,
			send: make(chan []byte, 256),
			log:  NewLogger(fmt.Sprintf("Client-%d", userID)),
		}

		// Registriere den Client im Hub
		hub.register <- client
		logger.Info("Client im Hub registriert: UserID=%d, ServerID=%s", userID, serverID)

		// Setze Pong-Handler
		c.SetPongHandler(func(string) error {
			c.SetReadDeadline(time.Now().Add(wsPongWait))
			return nil
		})

		// Setze initiales Read-Deadline
		c.SetReadDeadline(time.Now().Add(wsPongWait))

		// Starte eine Goroutine für das Lesen von Nachrichten
		go func() {
			defer func() {
				hub.unregister <- client
				c.Close()
				logger.Info("Client %d: WebSocket-Verbindung geschlossen", userID)
			}()

			for {
				messageType, message, err := c.ReadMessage()
				if err != nil {
					if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
						logger.Error("Unerwarteter WebSocket-Fehler: %v", err)
					}
					break
				}

				// Verarbeite die Nachricht
				if messageType == websocket.TextMessage {
					var msg map[string]interface{}
					if err := json.Unmarshal(message, &msg); err != nil {
						logger.Error("Fehler beim Parsen der Nachricht: %v", err)
						continue
					}

					// Verarbeite Ping-Nachrichten
					if msgType, ok := msg["type"].(string); ok && msgType == "ping" {
						response := map[string]string{"type": "pong"}
						responseBytes, err := json.Marshal(response)
						if err != nil {
							logger.Error("Fehler beim Erstellen der Pong-Antwort: %v", err)
							continue
						}
						if err := c.WriteMessage(websocket.TextMessage, responseBytes); err != nil {
							logger.Error("Fehler beim Senden der Pong-Antwort: %v", err)
							break
						}
						continue
					}

					// Verarbeite andere Nachrichtentypen
					hub.broadcast <- message
				}
			}
		}()

		// Starte eine Goroutine für das Senden von Nachrichten
		go func() {
			ticker := time.NewTicker(wsPingPeriod)
			defer func() {
				ticker.Stop()
				c.Close()
				logger.Info("Client %d: Send-Kanal wurde geschlossen", userID)
			}()

			for {
				select {
				case message, ok := <-client.send:
					c.SetWriteDeadline(time.Now().Add(wsWriteWait))
					if !ok {
						c.WriteMessage(websocket.CloseMessage, []byte{})
						return
					}

					w, err := c.NextWriter(websocket.TextMessage)
					if err != nil {
						logger.Error("Fehler beim Erstellen des Writers: %v", err)
						return
					}
					w.Write(message)

					n := len(client.send)
					for i := 0; i < n; i++ {
						w.Write([]byte{'\n'})
						w.Write(<-client.send)
					}

					if err := w.Close(); err != nil {
						logger.Error("Fehler beim Schließen des Writers: %v", err)
						return
					}
				case <-ticker.C:
					c.SetWriteDeadline(time.Now().Add(wsWriteWait))
					if err := c.WriteMessage(websocket.PingMessage, nil); err != nil {
						logger.Error("Fehler beim Senden des Pings: %v", err)
						return
					}
				}
			}
		}()
	}))

	logger.Info("WebSocket-Routen erfolgreich eingerichtet")
}
