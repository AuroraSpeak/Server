package models

import (
	"time"
)

type ChannelType string

const (
	ChannelTypeText  ChannelType = "text"
	ChannelTypeVoice ChannelType = "voice"
)

type Channel struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	ServerID    uint      `json:"serverId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Messages    []Message `json:"messages" gorm:"foreignKey:ChannelID"`
}

type ChannelResponse struct {
	ID          uint        `json:"id"`
	Name        string      `json:"name"`
	Type        ChannelType `json:"type"`
	Description string      `json:"description,omitempty"`
	ServerID    uint        `json:"serverId"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
}

func (c *Channel) ToResponse() *ChannelResponse {
	return &ChannelResponse{
		ID:          c.ID,
		Name:        c.Name,
		Type:        ChannelType(c.Type),
		Description: c.Description,
		ServerID:    c.ServerID,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}
} 