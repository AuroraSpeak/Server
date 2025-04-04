package models

import (
	"time"
)

type Message struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content"`
	UserID    uint      `json:"userId"`
	ChannelID uint      `json:"channelId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
}

type MessageResponse struct {
	ID        uint      `json:"id"`
	Content   string    `json:"content"`
	UserID    uint      `json:"userId"`
	ChannelID uint      `json:"channelId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (m *Message) ToResponse() *MessageResponse {
	return &MessageResponse{
		ID:        m.ID,
		Content:   m.Content,
		UserID:    m.UserID,
		ChannelID: m.ChannelID,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}
