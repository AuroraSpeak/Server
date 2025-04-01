package websocket

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func SetupWebSocketRoutes(app *fiber.App, hub *Hub) {
	// WebSocket Middleware
	app.Use("/ws", func(c *fiber.Ctx) error {
		// CORS-Header für WebSocket-Verbindungen
		c.Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, Connection, Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions")
		c.Set("Access-Control-Allow-Credentials", "true")
		c.Set("Access-Control-Expose-Headers", "Content-Length, Content-Type, Sec-WebSocket-Accept")

		if websocket.IsWebSocketUpgrade(c) {
			// Token aus Query-Parameter oder Authorization-Header extrahieren
			token := c.Query("token")
			if token == "" {
				auth := string(c.Request().Header.Peek("Authorization"))
				if auth != "" {
					token = strings.TrimPrefix(auth, "Bearer ")
				}
			}

			if token != "" {
				c.Locals("token", token)
			}
			return c.Next()
		}

		// Handle preflight requests
		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusOK)
		}

		return c.Status(fiber.StatusUpgradeRequired).JSON(fiber.Map{
			"error": "WebSocket upgrade required",
		})
	})

	// WebSocket Handler
	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Versuche userID aus dem Token zu extrahieren
		var userID string
		if token, ok := c.Locals("token").(string); ok && token != "" {
			// Hier können Sie den Token validieren und die userID extrahieren
			// Für dieses Beispiel verwenden wir den Token direkt als userID
			userID = token
		} else {
			// Generiere eine temporäre ID für nicht authentifizierte Benutzer
			userID = fmt.Sprintf("guest-%s", c.RemoteAddr().String())
		}

		client := &Client{
			ID:   userID,
			Conn: c,
			Hub:  hub,
			send: make(chan []byte, 256), // Puffer für 256 Nachrichten
		}

		// Registriere den Client im Hub
		hub.register <- client

		// Starte eine Goroutine für das Lesen von Nachrichten
		go func() {
			defer func() {
				hub.unregister <- client
				client.Conn.Close()
			}()

			client.ReadPump()
		}()

		// Starte eine Goroutine für das Schreiben von Nachrichten
		go func() {
			defer func() {
				client.Conn.Close()
			}()

			client.WritePump()
		}()

	}, websocket.Config{
		WriteBufferSize:   1024,
		ReadBufferSize:    1024,
		EnableCompression: true,
		Origins:           []string{"http://localhost:3000"},
		HandshakeTimeout:  20, // Sekunden
		Subprotocols:      []string{"auraspeak-v1"},
	}))
}
