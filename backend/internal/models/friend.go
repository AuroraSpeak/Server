package models

import (
	"time"
)

type Friend struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"userId" gorm:"index"`
	FriendID  uint      `json:"friendId" gorm:"index"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type FriendRequest struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	FromID    uint      `json:"fromId" gorm:"index"`
	ToID      uint      `json:"toId" gorm:"index"`
	Status    string    `json:"status" gorm:"type:varchar(20)"` // pending, accepted, rejected
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
