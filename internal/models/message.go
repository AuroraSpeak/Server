package models

import (
	"time"
)

type Attachment struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Type      string    `json:"type"`
	URL       string    `json:"url"`
	Name      string    `json:"name"`
	Size      int64     `json:"size"`
	MessageID uint      `json:"messageId"`
	CreatedAt time.Time `json:"createdAt"`
}

type Reaction struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Emoji     string    `json:"emoji"`
	MessageID uint      `json:"messageId"`
	UserID    uint      `json:"userId"`
	CreatedAt time.Time `json:"createdAt"`
}

type Message struct {
	ID          uint         `json:"id" gorm:"primaryKey"`
	Content     string       `json:"content"`
	UserID      uint         `json:"userId"`
	ChannelID   uint         `json:"channelId"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
	User        User         `json:"user" gorm:"foreignKey:UserID"`
	Attachments []Attachment `json:"attachments,omitempty" gorm:"foreignKey:MessageID"`
	Mentions    []User       `json:"mentions,omitempty" gorm:"many2many:message_mentions;"`
	Reactions   []Reaction   `json:"reactions,omitempty" gorm:"foreignKey:MessageID"`
}

type MessageResponse struct {
	ID          uint         `json:"id"`
	Content     string       `json:"content"`
	UserID      uint         `json:"userId"`
	ChannelID   uint         `json:"channelId"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
	Attachments []Attachment `json:"attachments,omitempty"`
	Mentions    []User       `json:"mentions,omitempty"`
	Reactions   []Reaction   `json:"reactions,omitempty"`
}

func (m *Message) ToResponse() *MessageResponse {
	return &MessageResponse{
		ID:          m.ID,
		Content:     m.Content,
		UserID:      m.UserID,
		ChannelID:   m.ChannelID,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
		Attachments: m.Attachments,
		Mentions:    m.Mentions,
		Reactions:   m.Reactions,
	}
}
