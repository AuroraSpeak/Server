package models

import (
	"time"
)

type ServerSettings struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	ServerID       uint      `json:"serverId" gorm:"index"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	IconURL        string    `json:"iconUrl"`
	BannerURL      string    `json:"bannerUrl"`
	DefaultChannel uint      `json:"defaultChannel"`
	DefaultRole    uint      `json:"defaultRole"`
	Verification   bool      `json:"verification"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
