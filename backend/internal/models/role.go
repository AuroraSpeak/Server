package models

import (
	"time"
)

type Role struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	ServerID    uint      `json:"serverId" gorm:"index"`
	Name        string    `json:"name"`
	Color       string    `json:"color"`
	Position    int       `json:"position"`
	Permissions int64     `json:"permissions"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type RolePermission struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	RoleID     uint      `json:"roleId" gorm:"index"`
	Permission string    `json:"permission"`
	Value      bool      `json:"value"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
