package routes

import (
	"github.com/auraspeak/backend/internal/handlers"
	"github.com/auraspeak/backend/internal/middleware"
	"github.com/auraspeak/backend/internal/services"
	"github.com/auraspeak/backend/internal/websocket"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, handlers *handlers.Handlers, wsHub *websocket.Hub, authService *services.AuthService) {
	// WebSocket routes müssen vor allen anderen Routen konfiguriert werden
	websocket.SetupWebSocketRoutes(app, wsHub, authService)

	// Public routes
	app.Post("/api/auth/register", handlers.Auth.Register)
	app.Post("/api/auth/login", handlers.Auth.Login)

	// Protected routes
	api := app.Group("/api")
	api.Use(middleware.AuthMiddleware(handlers.Auth.Service()))

	// Auth routes
	api.Get("/auth/me", handlers.Auth.Me)

	// Server routes
	api.Get("/servers", handlers.Server.GetUserServers)
	api.Post("/servers", handlers.Server.CreateServer)
	api.Get("/servers/:id", handlers.Server.GetServer)
	api.Get("/servers/:id/stats", handlers.Server.GetServerStats)
	api.Put("/servers/:id", handlers.Server.UpdateServer)
	api.Delete("/servers/:id", handlers.Server.DeleteServer)

	// Channel routes
	api.Post("/servers/:serverId/channels", handlers.Channel.CreateChannel)
	api.Get("/servers/:serverId/channels", handlers.Channel.GetServerChannels)
	api.Get("/channels/:id", handlers.Channel.GetChannel)
	api.Put("/channels/:id", handlers.Channel.UpdateChannel)
	api.Delete("/channels/:id", handlers.Channel.DeleteChannel)

	// Message routes
	api.Post("/channels/:channelId/messages", handlers.Message.CreateMessage)
	api.Get("/channels/:channelId/messages", handlers.Message.GetChannelMessages)
	api.Put("/messages/:id", handlers.Message.UpdateMessage)
	api.Delete("/messages/:id", handlers.Message.DeleteMessage)

	// WebRTC routes
	api.Post("/webrtc/offer", handlers.WebRTC.CreateOffer)
	api.Post("/webrtc/answer", handlers.WebRTC.CreateAnswer)
	api.Post("/webrtc/ice-candidate", handlers.WebRTC.AddICECandidate)

	// Channel Settings routes
	api.Get("/channels/:id/settings", handlers.ChannelSettings.GetSettings)
	api.Put("/channels/:id/settings", handlers.ChannelSettings.UpdateSettings)
	api.Get("/channels/:id/permissions", handlers.ChannelSettings.GetPermissionOverwrites)
	api.Post("/channels/:id/permissions", handlers.ChannelSettings.CreatePermissionOverwrite)
	api.Put("/channels/:id/permissions/:overwriteId", handlers.ChannelSettings.UpdatePermissionOverwrite)
	api.Delete("/channels/:id/permissions/:overwriteId", handlers.ChannelSettings.DeletePermissionOverwrite)

	// Invite routes
	api.Get("/invites/server/:serverId", handlers.Invite.GetInvites)
	api.Post("/invites/server/:serverId", handlers.Invite.CreateInvite)
	api.Delete("/invites/server/:serverId/:inviteId", handlers.Invite.DeleteInvite)
	api.Post("/invites/use/:code", handlers.Invite.UseInvite)
}
