package models

import (
	"time"
)

type MediaFile struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ChannelID uint      `json:"channelId" gorm:"index"`
	UserID    uint      `json:"userId" gorm:"index"`
	Filename  string    `json:"filename"`
	FileType  string    `json:"fileType"`
	FileSize  int64     `json:"fileSize"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
