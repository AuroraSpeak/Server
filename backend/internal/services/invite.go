package services

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type InviteService struct {
	db *gorm.DB
}

func NewInviteService(db *gorm.DB) *InviteService {
	return &InviteService{db: db}
}

func (s *InviteService) GetInvites(serverID uint) ([]models.Invite, error) {
	var invites []models.Invite
	err := s.db.Where("server_id = ?", serverID).Find(&invites).Error
	return invites, err
}

func (s *InviteService) CreateInvite(serverID, userID uint, maxUses int, expiresIn time.Duration) (*models.Invite, error) {
	// Generiere einen eindeutigen Code
	code, err := generateInviteCode()
	if err != nil {
		return nil, err
	}

	invite := &models.Invite{
		ServerID:    serverID,
		Code:        code,
		CreatedByID: userID,
		MaxUses:     maxUses,
		Uses:        0,
		ExpiresAt:   time.Now().Add(expiresIn),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.Create(invite).Error; err != nil {
		return nil, err
	}

	return invite, nil
}

func (s *InviteService) UseInvite(code string) error {
	var invite models.Invite
	if err := s.db.Where("code = ?", code).First(&invite).Error; err != nil {
		return err
	}

	// Überprüfe, ob der Einladungscode noch gültig ist
	if invite.ExpiresAt.Before(time.Now()) {
		return errors.New("Einladungscode ist abgelaufen")
	}

	if invite.MaxUses > 0 && invite.Uses >= invite.MaxUses {
		return errors.New("Einladungscode wurde bereits zu oft verwendet")
	}

	// Erhöhe die Nutzungsanzahl
	return s.db.Model(&invite).Update("uses", invite.Uses+1).Error
}

func (s *InviteService) DeleteInvite(serverID uint, inviteID uint) error {
	return s.db.Where("id = ? AND server_id = ?", inviteID, serverID).Delete(&models.Invite{}).Error
}

func generateInviteCode() (string, error) {
	// Generiere 16 zufällige Bytes
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	// Konvertiere zu Base64 und entferne Sonderzeichen
	code := base64.URLEncoding.EncodeToString(b)
	code = code[:8] // Kürze auf 8 Zeichen

	return code, nil
}
