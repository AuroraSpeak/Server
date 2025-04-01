package websocket

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func SetupWebSocketRoutes(app *fiber.App, hub *Hub) {
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Get user ID from context (assuming it's set by auth middleware)
		userID := c.Locals("userID").(string)

		client := &Client{
			ID:   userID,
			Conn: c,
			Hub:  hub,
		}

		hub.register <- client

		// Start reading messages
		client.ReadPump()
	}))
}
