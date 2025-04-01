package handlers

import (
	"github.com/auraspeak/backend/internal/services"
	"gorm.io/gorm"
)

type Handlers struct {
	Auth    *AuthHandler
	Server  *ServerHandler
	Channel *ChannelHandler
	Message *MessageHandler
	WebRTC  *WebRTCHandler
}

func NewHandlers(
	db *gorm.DB,
	authService *services.AuthService,
	serverService *services.ServerService,
	channelService *services.ChannelService,
	messageService *services.MessageService,
	webrtcService *services.WebRTCService,
) *Handlers {
	return &Handlers{
		Auth:    NewAuthHandler(authService),
		Server:  NewServerHandler(serverService),
		Channel: NewChannelHandler(channelService, serverService),
		Message: NewMessageHandler(messageService, serverService),
		WebRTC:  NewWebRTCHandler(db, webrtcService),
	}
}
