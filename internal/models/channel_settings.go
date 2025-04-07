package models

import (
	"errors"
	"time"
)

var (
	ErrInvalidChannelType = errors.New("ungültiger Kanaltyp")
	ErrInvalidBitrate     = errors.New("ungültige Bitrate")
	ErrInvalidUserLimit   = errors.New("ungültiges Benutzerlimit")
)

type ChannelSettings struct {
	ID               uint        `json:"id" gorm:"primaryKey"`
	Name             string      `json:"name" gorm:"not null"`
	Type             ChannelType `json:"type" gorm:"not null"`
	Topic            string      `json:"topic,omitempty"`
	NSFW             bool        `json:"nsfw"`
	RateLimitPerUser int         `json:"rateLimitPerUser" gorm:"default:0"`
	Bitrate          int         `json:"bitrate,omitempty"`
	UserLimit        int         `json:"userLimit,omitempty"`
	ParentID         *uint       `json:"parentId,omitempty"`
	Position         int         `json:"position" gorm:"default:0"`
	ServerID         uint        `json:"serverId" gorm:"not null"`
	CreatedAt        time.Time   `json:"createdAt"`
	UpdatedAt        time.Time   `json:"updatedAt"`
}

func (cs *ChannelSettings) Validate() error {
	switch cs.Type {
	case ChannelTypeText:
		// Text-Kanäle haben keine speziellen Validierungen
		return nil
	case ChannelTypeVoice:
		if cs.Bitrate < 8000 || cs.Bitrate > 128000 {
			return ErrInvalidBitrate
		}
		if cs.UserLimit < 0 || cs.UserLimit > 99 {
			return ErrInvalidUserLimit
		}
		return nil
	default:
		return ErrInvalidChannelType
	}
}

type PermissionOverwrite struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ChannelID uint      `json:"channelId" gorm:"not null"`
	Type      string    `json:"type" gorm:"not null"`
	Allow     string    `json:"allow" gorm:"not null"`
	Deny      string    `json:"deny" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (po *PermissionOverwrite) Validate() error {
	switch po.Type {
	case "role", "member":
		return nil
	default:
		return errors.New("ungültiger Berechtigungstyp")
	}
}
