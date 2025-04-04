package models

import (
	"time"
)

type Invite struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	ServerID    uint      `json:"serverId" gorm:"index"`
	Code        string    `json:"code" gorm:"uniqueIndex"`
	CreatedByID uint      `json:"createdById" gorm:"index"`
	MaxUses     int       `json:"maxUses"`
	Uses        int       `json:"uses"`
	ExpiresAt   time.Time `json:"expiresAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
