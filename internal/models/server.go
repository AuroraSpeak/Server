package models

import (
	"time"
)

type Server struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	AvatarURL   string    `json:"avatarUrl,omitempty"`
	OwnerID     uint      `json:"ownerId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Members     []Member  `json:"members" gorm:"foreignKey:ServerID"`
	Channels    []Channel `json:"channels" gorm:"foreignKey:ServerID"`
}

type ServerStats struct {
	CPU    float64 `json:"cpu"`
	Memory float64 `json:"memory"`
	Disk   float64 `json:"disk"`
	Uptime int64   `json:"uptime"`
}

type ServerResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	AvatarURL   string    `json:"avatarUrl,omitempty"`
	OwnerID     uint      `json:"ownerId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (s *Server) ToResponse() *ServerResponse {
	return &ServerResponse{
		ID:          s.ID,
		Name:        s.Name,
		Description: s.Description,
		AvatarURL:   s.AvatarURL,
		OwnerID:     s.OwnerID,
		CreatedAt:   s.CreatedAt,
		UpdatedAt:   s.UpdatedAt,
	}
}
