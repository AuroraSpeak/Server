package handlers

import (
	"github.com/auraspeak/backend/internal/services"
	"github.com/auraspeak/backend/internal/websocket"
)

type Handlers struct {
	Auth            *AuthHandler
	Server          *ServerHandler
	Channel         *ChannelHandler
	Message         *MessageHandler
	Role            *RoleHandler
	WebRTC          *WebRTCHandler
	Invite          *InviteHandler
	ChannelSettings *ChannelSettingsHandler
}

func NewHandlers(
	authService *services.AuthService,
	serverService *services.ServerService,
	channelService *services.ChannelService,
	messageService *services.MessageService,
	roleService *services.RoleService,
	webrtcService *services.WebRTCService,
	inviteService *services.InviteService,
	channelSettingsService *services.ChannelSettingsService,
	wsHub *websocket.Hub,
) *Handlers {
	return &Handlers{
		Auth:            NewAuthHandler(authService),
		Server:          NewServerHandler(serverService),
		Channel:         NewChannelHandler(channelService, serverService),
		Message:         NewMessageHandler(messageService, serverService, wsHub),
		Role:            NewRoleHandler(roleService),
		WebRTC:          NewWebRTCHandler(webrtcService),
		Invite:          NewInviteHandler(inviteService),
		ChannelSettings: NewChannelSettingsHandler(channelSettingsService),
	}
}
