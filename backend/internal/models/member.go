package models

import (
	"time"
)

type MemberRole string

const (
	MemberRoleOwner  MemberRole = "owner"
	MemberRoleAdmin  MemberRole = "admin"
	MemberRoleMember MemberRole = "member"
)

type Member struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"userId"`
	ServerID  uint      `json:"serverId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
	Role      MemberRole `json:"role"`
	Nickname  string     `json:"nickname,omitempty"`
}

type MemberResponse struct {
	ID        uint       `json:"id"`
	UserID    uint       `json:"userId"`
	ServerID  uint       `json:"serverId"`
	Role      MemberRole `json:"role"`
	Nickname  string     `json:"nickname,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

func (m *Member) ToResponse() *MemberResponse {
	return &MemberResponse{
		ID:        m.ID,
		UserID:    m.UserID,
		ServerID:  m.ServerID,
		Role:      m.Role,
		Nickname:  m.Nickname,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
} 