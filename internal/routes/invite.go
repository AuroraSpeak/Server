package routes

import (
	"github.com/auraspeak/backend/internal/handlers"
	"github.com/gofiber/fiber/v2"
)

func SetupInviteRoutes(router fiber.Router, inviteHandler *handlers.InviteHandler) {
	invite := router.Group("/invites")

	// Server-spezifische Einladungen
	serverInvites := invite.Group("/server/:serverId")
	serverInvites.Get("/", inviteHandler.GetInvites)               // GET /api/invites/server/:serverId
	serverInvites.Post("/", inviteHandler.CreateInvite)            // POST /api/invites/server/:serverId
	serverInvites.Delete("/:inviteId", inviteHandler.DeleteInvite) // DELETE /api/invites/server/:serverId/:inviteId

	// Einladungscode verwenden
	invite.Post("/use/:code", inviteHandler.UseInvite) // POST /api/invites/use/:code
}
