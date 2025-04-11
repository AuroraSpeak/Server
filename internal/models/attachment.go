package models

import (
	"time"

	"gorm.io/gorm"
)

type Attachment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	MessageID uint           `gorm:"not null" json:"messageId"`
	FileName  string         `gorm:"size:255;not null" json:"fileName"`
	FilePath  string         `gorm:"size:255;not null" json:"filePath"`
	FileType  string         `gorm:"size:50;not null" json:"fileType"`
	FileSize  int64          `gorm:"not null" json:"fileSize"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Message   Message        `gorm:"foreignKey:MessageID" json:"-"`
}
